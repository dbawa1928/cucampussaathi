import { Router } from 'express';
import { directoryController } from '../controllers/directoryController';
import { optionalAuthGuard } from '../middleware/authGuard';

const router = Router();

// GET /api/v1/directory
router.get('/', optionalAuthGuard, directoryController.searchDirectory.bind(directoryController));

export default router;
