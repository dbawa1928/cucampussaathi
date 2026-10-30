import { Request, Response, NextFunction } from 'express';
import { aiTutorService } from '../services/aiTutorService';
import { AppError } from '../utils/errors';

export class AiTutorController {
  /**
   * POST /api/v1/ai/documents/:id/chat
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documentId = req.params.id;
      const { question, conversationId, language } = req.body;

      if (!question || typeof question !== 'string') {
        throw new AppError('Question text is required.', 400);
      }

      const response = await aiTutorService.chat(
        userId,
        documentId,
        question,
        conversationId,
        language
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/documents/:id/summarize
   */
  async summarize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documentId = req.params.id;
      const summaryType = req.body.summaryType || 'detailed';

      const summary = await aiTutorService.summarize(userId, documentId, summaryType);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/documents/:id/conversations
   */
  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documentId = req.params.id;

      const conversations = await aiTutorService.listConversations(userId, documentId);

      res.status(200).json({
        success: true,
        data: {
          conversations,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ai/conversations/:conversationId
   */
  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const conversationId = req.params.conversationId;

      const conversation = await aiTutorService.getConversation(conversationId, userId);

      res.status(200).json({
        success: true,
        data: {
          conversation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/ai/conversations/:conversationId
   */
  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const conversationId = req.params.conversationId;

      await aiTutorService.deleteConversation(conversationId, userId);

      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/documents/:id/tools
   */
  async generateTool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documentId = req.params.id;
      const { toolType, style, topic } = req.body;

      if (!toolType) {
        throw new AppError('toolType (summary, exam_prep, notes, concept_explainer) is required.', 400);
      }

      const result = await aiTutorService.generateTool(userId, documentId, toolType, { style, topic });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ai/documents/:id/quiz
   */
  async generateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documentId = req.params.id;
      const numQuestions = req.body.numQuestions ? parseInt(req.body.numQuestions, 10) : 5;

      const result = await aiTutorService.generateQuiz(userId, documentId, numQuestions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiTutorController = new AiTutorController();
