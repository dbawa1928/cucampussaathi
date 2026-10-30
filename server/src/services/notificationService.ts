import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/Notification';
import { emitToUser } from '../socket';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateNotificationDto {
  recipient: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointment?: string | Types.ObjectId;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Persist a notification to MongoDB and emit real-time Socket.IO events to the recipient.
   */
  async createNotification(data: CreateNotificationDto): Promise<INotification> {
    const recipientId =
      typeof data.recipient === 'string'
        ? new Types.ObjectId(data.recipient)
        : data.recipient;

    const appointmentId = data.relatedAppointment
      ? typeof data.relatedAppointment === 'string'
        ? new Types.ObjectId(data.relatedAppointment)
        : data.relatedAppointment
      : undefined;

    const notification = await Notification.create({
      recipient: recipientId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedAppointment: appointmentId,
      metadata: data.metadata,
      isRead: false,
    });

    // Calculate unread count & emit to user socket room
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        isRead: false,
      });

      emitToUser(recipientId.toString(), 'notification:new', notification.toJSON());
      emitToUser(recipientId.toString(), 'notification:unread-count', { count: unreadCount });
    } catch (err: any) {
      logger.warn(`Failed to emit socket notification to user ${recipientId.toString()}: ${err.message}`);
    }

    return notification;
  }

  /**
   * Get paginated notifications for the authenticated user.
   */
  async getNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{
    notifications: INotification[];
    pagination: {
      total: number;
      unreadCount: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const query: any = { recipient: userObjectId };
    if (options.unreadOnly) {
      query.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userObjectId, isRead: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedAppointment', 'status agenda meetingMode meetingLink'),
    ]);

    return {
      notifications,
      pagination: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get unread notification count for authenticated user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    return Notification.countDocuments({ recipient: userObjectId, isRead: false });
  }

  /**
   * Mark a single notification as read after verifying ownership.
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification identifier format.', 400);
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.recipient.toString() !== userId) {
      throw new AppError('You are not authorized to modify this notification.', 403);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      // Emit updated unread count to user socket
      const unreadCount = await Notification.countDocuments({
        recipient: notification.recipient,
        isRead: false,
      });

      emitToUser(userId, 'notification:read', { notificationId: notification._id });
      emitToUser(userId, 'notification:unread-count', { count: unreadCount });
    }

    return notification;
  }

  /**
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const userObjectId = new Types.ObjectId(userId);

    const result = await Notification.updateMany(
      { recipient: userObjectId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    emitToUser(userId, 'notification:unread-count', { count: 0 });

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification after verifying ownership.
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification identifier format.', 400);
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.recipient.toString() !== userId) {
      throw new AppError('You are not authorized to delete this notification.', 403);
    }

    await notification.deleteOne();

    const unreadCount = await Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    });
    emitToUser(userId, 'notification:unread-count', { count: unreadCount });
  }
}

export const notificationService = new NotificationService();
