import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// All notification endpoints require authenticated session
router.use(authGuard);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
