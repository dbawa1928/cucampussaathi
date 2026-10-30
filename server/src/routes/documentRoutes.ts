import { Router } from 'express';
import { documentController, documentUploadMiddleware } from '../controllers/documentController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Upload document (authenticated students/faculty)
router.post(
  '/upload',
  authGuard,
  documentUploadMiddleware,
  documentController.upload.bind(documentController)
);

// List authenticated user's documents
router.get('/', authGuard, documentController.list.bind(documentController));

// Admin: overview and list of all campus documents
router.get(
  '/admin/all',
  authGuard,
  roleGuard('ADMIN'),
  documentController.adminListAll.bind(documentController)
);

// Get single document metadata
router.get('/:id', authGuard, documentController.getById.bind(documentController));

// Delete document and all indexed chunks & conversations
router.delete('/:id', authGuard, documentController.delete.bind(documentController));

// Check document indexing/processing status
router.get('/:id/status', authGuard, documentController.getStatus.bind(documentController));

// Stream PDF file for in-browser viewer
router.get('/:id/file', authGuard, documentController.getFile.bind(documentController));

export default router;
