import { Types } from 'mongoose';
import { DocumentModel, IDocument } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';
import { DocumentConversationModel } from '../models/DocumentConversation';
import { documentStorageService } from './documentStorageService';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';

import { documentExtractionService } from './documentExtractionService';

export class DocumentService {
  /**
   * Upload and process a new study document (PDF, PowerPoint .pptx, Word .docx) for an authenticated student.
   * Strict validation of MIME type, format signatures, file size, and page/slide content.
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

    // 2. Validate format & extract document structure
    const { format, pages, totalTextLength, mimeType } =
      await documentExtractionService.extractDocument(fileBuffer, originalFilename);

    if (pages.length > 250) {
      throw new AppError('Document exceeds maximum supported limit of 250 pages/slides.', 400);
    }

    // 3. Save physical file safely
    const { storageKey, storagePath, fileSize } = await documentStorageService.saveFile(
      fileBuffer,
      originalFilename
    );

    const title =
      customTitle?.trim() ||
      originalFilename.replace(/\.(pdf|pptx|docx|ppt|doc)$/i, '').trim();

    // 4. Create document record in database
    const document = await DocumentModel.create({
      owner: new Types.ObjectId(userId),
      title: title.substring(0, 200),
      originalFilename,
      mimeType,
      documentFormat: format,
      fileSize,
      storagePath,
      storageKey,
      pageCount: pages.length,
      extractedPages: pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        type: p.type || (format === 'pptx' ? 'slide' : 'page'),
      })),
      processingStatus: 'PROCESSING',
      chunkCount: 0,
      embeddingProvider: 'bm25-lexical',
      extractedTextLength: totalTextLength,
    });

    try {
      // 5. Generate chunks
      const chunksData = documentExtractionService.createChunks(pages);

      // 6. Store chunks in database
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
          format,
        },
      }));

      if (chunkDocs.length > 0) {
        await DocumentChunkModel.insertMany(chunkDocs);
      }

      // 7. Mark processing as completed
      document.processingStatus = 'COMPLETED';
      document.chunkCount = chunkDocs.length;
      await document.save();

      logger.info(
        `Document ${document._id} (${format.toUpperCase()}) processed successfully: ${pages.length} pages/slides, ${chunkDocs.length} chunks.`
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

  /**
   * Retrieve extracted pages or slides for the in-browser document viewer.
   */
  async getDocumentContent(
    documentId: string,
    userId: string,
    isAdmin = false
  ): Promise<{
    document: IDocument;
    pages: { pageNumber: number; text: string; type?: string }[];
  }> {
    const document = await this.getDocumentById(documentId, userId, isAdmin);
    return {
      document,
      pages: document.extractedPages || [],
    };
  }
}

export const documentService = new DocumentService();
