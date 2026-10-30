import { Types } from 'mongoose';
import { DocumentModel, IDocument } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';
import { DocumentConversationModel } from '../models/DocumentConversation';
import { documentStorageService } from './documentStorageService';
import { pdfProcessingService } from './pdfProcessingService';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';

export class DocumentService {
  /**
   * Upload and process a new PDF study document for an authenticated student.
   * Strict validation of MIME type, PDF signature, file size, and page content.
   */
  async uploadAndProcessDocument(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    customTitle?: string
  ): Promise<IDocument> {
    // 1. Basic validation
    const maxBytes = env.MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
    if (fileBuffer.length > maxBytes) {
      throw new AppError(
        `File size exceeds the allowable limit of ${env.MAX_DOCUMENT_SIZE_MB}MB.`,
        400
      );
    }

    // 2. Validate PDF magic bytes
    pdfProcessingService.validatePdfSignature(fileBuffer);

    // 3. Save physical file safely
    const { storageKey, storagePath, fileSize } = await documentStorageService.saveFile(
      fileBuffer,
      originalFilename
    );

    const title = customTitle?.trim() || originalFilename.replace(/\.pdf$/i, '').trim();

    // 4. Create document record in database
    const document = await DocumentModel.create({
      owner: new Types.ObjectId(userId),
      title: title.substring(0, 200),
      originalFilename,
      mimeType: 'application/pdf',
      fileSize,
      storagePath,
      storageKey,
      pageCount: 0,
      processingStatus: 'PROCESSING',
      chunkCount: 0,
      embeddingProvider: 'bm25-lexical',
    });

    try {
      // 5. Extract pages and clean text
      const { pages, totalTextLength } = await pdfProcessingService.extractPages(fileBuffer);

      if (pages.length > 200) {
        throw new AppError('Document exceeds maximum supported limit of 200 pages.', 400);
      }

      // 6. Generate chunks
      const chunksData = pdfProcessingService.createChunks(pages);

      // 7. Store chunks in database
      const chunkDocs = chunksData.map((c) => ({
        document: document._id,
        owner: new Types.ObjectId(userId),
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        content: c.content,
        tokenCount: c.tokenCount,
        metadata: {
          originalFilename,
          pageNumber: c.pageNumber,
        },
      }));

      if (chunkDocs.length > 0) {
        await DocumentChunkModel.insertMany(chunkDocs);
      }

      // 8. Mark processing as completed
      document.processingStatus = 'COMPLETED';
      document.pageCount = pages.length;
      document.chunkCount = chunkDocs.length;
      document.extractedTextLength = totalTextLength;
      await document.save();

      logger.info(
        `Document ${document._id} processed successfully: ${pages.length} pages, ${chunkDocs.length} chunks.`
      );

      return document;
    } catch (err: any) {
      document.processingStatus = 'FAILED';
      document.processingError = err.message || 'Processing failed.';
      await document.save().catch(() => {});

      logger.error(`Document ${document._id} processing failed: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * List all documents owned by authenticated user.
   */
  async listUserDocuments(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({ owner: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  /**
   * Get document by ID with strict ownership verification.
   */
  async getDocumentById(documentId: string, userId: string, isAdmin = false): Promise<IDocument> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new NotFoundError('Invalid document identifier format.');
    }

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new NotFoundError('Document not found.');
    }

    // Strict ownership verification: Non-admins can only access their own documents
    if (!isAdmin && document.owner.toString() !== userId) {
      throw new AppError('You do not have authorization to view this document.', 403);
    }

    return document;
  }

  /**
   * Delete document and perform cascading cleanup:
   * 1. Physical file on disk
   * 2. Document chunks & embeddings
   * 3. Associated chat conversations
   * 4. Document database record
   */
  async deleteDocument(documentId: string, userId: string, isAdmin = false): Promise<void> {
    const document = await this.getDocumentById(documentId, userId, isAdmin);

    // 1. Delete physical file
    await documentStorageService.deleteFile(document.storagePath);

    // 2. Cascade delete all chunks
    await DocumentChunkModel.deleteMany({ document: document._id });

    // 3. Cascade delete all associated conversations
    await DocumentConversationModel.deleteMany({ document: document._id });

    // 4. Delete the document record itself
    await DocumentModel.findByIdAndDelete(document._id);

    logger.info(`Document ${documentId} and all associated chunks/data deleted.`);
  }

  /**
   * Get processing status of a document.
   */
  async getDocumentStatus(documentId: string, userId: string, isAdmin = false) {
    const document = await this.getDocumentById(documentId, userId, isAdmin);
    return {
      id: document._id,
      title: document.title,
      processingStatus: document.processingStatus,
      pageCount: document.pageCount,
      chunkCount: document.chunkCount,
      processingError: document.processingError,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
    };
  }

  /**
   * Admin: List all campus documents with owner information.
   */
  async adminListDocuments(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      DocumentModel.find()
        .populate('owner', 'fullName email uid department role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DocumentModel.countDocuments(),
    ]);

    const stats = await DocumentModel.aggregate([
      {
        $group: {
          _id: null,
          totalStorageBytes: { $sum: '$fileSize' },
          totalChunks: { $sum: '$chunkCount' },
          totalCompleted: {
            $sum: { $cond: [{ $eq: ['$processingStatus', 'COMPLETED'] }, 1, 0] },
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$processingStatus', 'FAILED'] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        totalStorageBytes: 0,
        totalChunks: 0,
        totalCompleted: 0,
        totalFailed: 0,
      },
    };
  }
}

export const documentService = new DocumentService();
