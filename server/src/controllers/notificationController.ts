import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { notificationQuerySchema } from '../utils/validators';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List paginated notifications for the authenticated user.
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = notificationQuerySchema.parse(req.query);
      const result = await notificationService.getNotifications(req.user!.id, query);

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Return unread notification count for the authenticated user.
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:notificationId/read
   * Mark a single notification as read.
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(req.user!.id, notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: { notification },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications/:notificationId
   * Delete a notification belonging to the authenticated user.
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(req.user!.id, notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
