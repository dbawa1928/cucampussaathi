import { Types } from 'mongoose';
import { documentService } from './documentService';
import { retrievalService } from './retrievalService';
import { groqService } from './groqService';
import { DocumentChunkModel } from '../models/DocumentChunk';
import {
  DocumentConversationModel,
  IDocumentConversation,
  ISourceReference,
} from '../models/DocumentConversation';
import { AppError, NotFoundError } from '../utils/errors';

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sourceReferences: {
    pageNumber: number;
    chunkId?: string;
    excerpt: string;
  }[];
  retrievalMethod: string;
  model: string;
}

export class AiTutorService {
  /**
   * Ask question grounded in student's uploaded document.
   * Full RAG pipeline: Ownership -> Retrieval -> Prompt Construction -> Groq LLM -> Citation Extraction.
   */
  async chat(
    userId: string,
    documentId: string,
    question: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const trimmedQuestion = question?.trim();
    if (!trimmedQuestion || trimmedQuestion.length < 2) {
      throw new AppError('Question must be at least 2 characters long.', 400);
    }

    if (trimmedQuestion.length > 1000) {
      throw new AppError('Question exceeds maximum limit of 1000 characters.', 400);
    }

    // 1. Verify document ownership & completion status
    const document = await documentService.getDocumentById(documentId, userId);
    if (document.processingStatus === 'PROCESSING') {
      throw new AppError(
        'This document is currently being indexed. Please wait a few moments and try again.',
        400
      );
    }

    if (document.processingStatus === 'FAILED') {
      throw new AppError(
        `Document processing failed: ${document.processingError || 'Unable to index document content.'}`,
        400
      );
    }

    // 2. Load or initialize Conversation
    let conversation: IDocumentConversation | null = null;
    if (conversationId && Types.ObjectId.isValid(conversationId)) {
      conversation = await DocumentConversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        owner: new Types.ObjectId(userId),
        document: document._id,
      });
    }

    if (!conversation) {
      conversation = await DocumentConversationModel.create({
        owner: new Types.ObjectId(userId),
        document: document._id,
        title: trimmedQuestion.substring(0, 50),
        messages: [],
      });
    }

    // 3. Retrieve relevant chunks using BM25
    const retrieval = await retrievalService.retrieveRelevantChunks(
      document._id,
      userId,
      trimmedQuestion,
      4
    );

    // 4. Format previous conversation history for multi-turn context
    const previousHistory = conversation.messages.map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    // 5. Generate grounded answer with Groq LLM
    const completion = await groqService.generateAnswer(
      trimmedQuestion,
      retrieval.chunks,
      document.title,
      previousHistory
    );

    // 6. Build verified source references
    const sourceReferences: ISourceReference[] = retrieval.chunks.map((chunk) => ({
      documentId: document._id as any,
      pageNumber: chunk.pageNumber,
      chunkId: chunk._id as any,
      excerpt: chunk.content.substring(0, 250).replace(/\s+/g, ' ').trim() + '...',
    }));

    // 7. Persist messages to conversation history
    conversation.messages.push({
      role: 'USER',
      content: trimmedQuestion,
      createdAt: new Date(),
    });

    conversation.messages.push({
      role: 'ASSISTANT',
      content: completion.answer,
      sourceReferences,
      createdAt: new Date(),
    });

    await conversation.save();

    return {
      conversationId: conversation._id.toString(),
      answer: completion.answer,
      sourceReferences: sourceReferences.map((sr) => ({
        pageNumber: sr.pageNumber,
        chunkId: sr.chunkId?.toString(),
        excerpt: sr.excerpt,
      })),
      retrievalMethod: retrieval.retrievalMethod,
      model: completion.model,
    };
  }

  /**
   * Generate grounded summary of document (short, detailed, key_concepts, exam_notes).
   */
  async summarize(
    userId: string,
    documentId: string,
    summaryType: 'short' | 'detailed' | 'key_concepts' | 'exam_notes' = 'detailed'
  ) {
    const document = await documentService.getDocumentById(documentId, userId);

    if (document.processingStatus !== 'COMPLETED') {
      throw new AppError('Document must be fully processed before generating a summary.', 400);
    }

    // Retrieve representative chunks across the document
    const representativeChunks = await DocumentChunkModel.find({
      document: document._id,
      owner: new Types.ObjectId(userId),
    })
      .sort({ chunkIndex: 1 })
      .limit(8);

    if (!representativeChunks || representativeChunks.length === 0) {
      throw new AppError('No document content found to summarize.', 404);
    }

    const completion = await groqService.generateSummary(
      document.title,
      representativeChunks,
      summaryType
    );

    return {
      documentId: document._id,
      title: document.title,
      summaryType,
      summary: completion.answer,
      model: completion.model,
      pageCount: document.pageCount,
    };
  }

  /**
   * List conversations for a document.
   */
  async listConversations(userId: string, documentId: string) {
    await documentService.getDocumentById(documentId, userId);
    return DocumentConversationModel.find({
      document: new Types.ObjectId(documentId),
      owner: new Types.ObjectId(userId),
    })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 });
  }

  /**
   * Get specific conversation messages.
   */
  async getConversation(conversationId: string, userId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundError('Invalid conversation identifier format.');
    }

    const conv = await DocumentConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      owner: new Types.ObjectId(userId),
    });

    if (!conv) {
      throw new NotFoundError('Conversation not found.');
    }

    return conv;
  }

  /**
   * Delete specific conversation.
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundError('Invalid conversation identifier format.');
    }

    const deleted = await DocumentConversationModel.findOneAndDelete({
      _id: new Types.ObjectId(conversationId),
      owner: new Types.ObjectId(userId),
    });

    if (!deleted) {
      throw new NotFoundError('Conversation not found or unauthorized.');
    }
  }
}

export const aiTutorService = new AiTutorService();
