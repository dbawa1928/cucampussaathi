import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/documentService';
import { documentStorageService } from '../services/documentStorageService';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

// Configure Multer for in-memory upload buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_DOCUMENT_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      return cb(new AppError('Only valid PDF document files are supported.', 400));
    }
    cb(null, true);
  },
});

export const documentUploadMiddleware = upload.single('file');

export class DocumentController {
  /**
   * POST /api/v1/documents/upload
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw new AppError('No PDF file uploaded. Please attach a valid PDF document.', 400);
      }

      const userId = req.user!._id.toString();
      const customTitle = req.body.title as string | undefined;

      const document = await documentService.uploadAndProcessDocument(
        userId,
        req.file.buffer,
        req.file.originalname,
        customTitle
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded and indexed successfully.',
        data: {
          document,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const documents = await documentService.listUserDocuments(userId);

      res.status(200).json({
        success: true,
        data: {
          documents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const document = await documentService.getDocumentById(req.params.id, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: {
          document,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/documents/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      await documentService.deleteDocument(req.params.id, userId, isAdmin);

      res.status(200).json({
        success: true,
        message: 'Document and all associated indexed data permanently deleted.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/:id/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const status = await documentService.getDocumentStatus(req.params.id, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/:id/file
   * Streams PDF file for verified owner or admin to display in integrated viewer
   */
  async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const document = await documentService.getDocumentById(req.params.id, userId, isAdmin);

      const filePath = documentStorageService.resolveAbsolutePath(document.storagePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalFilename)}"`);
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/admin/all
   * Admin campus document overview & storage tracking
   */
  async adminListAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await documentService.adminListDocuments(limit, page);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
