import { Types } from 'mongoose';
import {
  CampusEvent,
  ICampusEvent,
  EventRegistration,
  IEventRegistration,
  EventReminderLog,
  Notification,
  User,
} from '../models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { emitToUser } from '../socket';

export class EventService {
  /**
   * Helper to generate URL slug from title
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomSuffix}`;
  }

  /**
   * 1. Public Events Listing (Accessible without login)
   */
  async listPublicEvents(params: {
    category?: string;
    mode?: 'ONLINE' | 'OFFLINE';
    timeframe?: 'upcoming' | 'today' | 'this-week' | 'past' | 'all';
    search?: string;
    month?: string; // e.g. "2026-11"
    page?: number;
    limit?: number;
  }): Promise<{ events: ICampusEvent[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {
      status: { $in: ['PUBLISHED', 'CANCELLED', 'COMPLETED'] },
    };

    if (params.category && params.category !== 'ALL') {
      query.category = params.category;
    }

    if (params.mode) {
      query.mode = params.mode;
    }

    const now = new Date();

    if (params.month) {
      // Month format "YYYY-MM"
      const [yearStr, monthStr] = params.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
      query.startDateTime = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (params.timeframe) {
      if (params.timeframe === 'upcoming') {
        query.startDateTime = { $gte: now };
        query.status = { $in: ['PUBLISHED', 'CANCELLED'] };
      } else if (params.timeframe === 'today') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        query.startDateTime = { $gte: startOfDay, $lte: endOfDay };
      } else if (params.timeframe === 'this-week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        query.startDateTime = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (params.timeframe === 'past') {
        query.$or = [{ endDateTime: { $lt: now } }, { status: 'COMPLETED' }];
      }
    }

    const andClauses: any[] = [];
    if (query.$or) {
      andClauses.push({ $or: query.$or });
      delete query.$or;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      andClauses.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { shortDescription: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { venue: { $regex: q, $options: 'i' } },
          { organizerName: { $regex: q, $options: 'i' } },
          { 'speakerDetails.name': { $regex: q, $options: 'i' } },
        ],
      });
    }

    if (andClauses.length === 1) {
      query.$or = andClauses[0].$or;
    } else if (andClauses.length > 1) {
      query.$and = andClauses;
    }

    const sortOrder: any = params.timeframe === 'past' ? { startDateTime: -1 } : { startDateTime: 1 };

    const [events, total] = await Promise.all([
      CampusEvent.find(query)
        .populate('createdBy', 'fullName email role avatarUrl')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit),
      CampusEvent.countDocuments(query),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Featured Upcoming Events
   */
  async getFeaturedEvents(): Promise<ICampusEvent[]> {
    const now = new Date();
    return CampusEvent.find({
      status: 'PUBLISHED',
      startDateTime: { $gte: now },
    })
      .populate('createdBy', 'fullName email role avatarUrl')
      .sort({ startDateTime: 1 })
      .limit(4);
  }

  /**
   * 3. Single Public Event by ID or Slug
   */
  async getPublicEventById(idOrSlug: string, userId?: string): Promise<{
    event: ICampusEvent;
    isRegistered?: boolean;
    registration?: IEventRegistration | null;
  }> {
    let event: ICampusEvent | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      event = await CampusEvent.findById(idOrSlug).populate(
        'createdBy',
        'fullName email role avatarUrl'
      );
    }

    if (!event) {
      event = await CampusEvent.findOne({ slug: idOrSlug.toLowerCase() }).populate(
        'createdBy',
        'fullName email role avatarUrl'
      );
    }

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // If DRAFT, only the creator or admin can view
    if (event.status === 'DRAFT') {
      if (!userId || event.createdBy._id.toString() !== userId) {
        throw new AppError('This event draft is not accessible publicly', 403);
      }
    }

    let isRegistered = false;
    let registration: IEventRegistration | null = null;

    if (userId) {
      registration = await EventRegistration.findOne({
        event: event._id,
        user: new Types.ObjectId(userId),
        status: 'REGISTERED',
      });
      isRegistered = !!registration;
    }

    return { event, isRegistered, registration };
  }

  /**
   * 4. Teacher: Create Event
   */
  async createEvent(userId: string, data: any): Promise<ICampusEvent> {
    const slug = this.generateSlug(data.title);

    const event = await CampusEvent.create({
      ...data,
      slug,
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
      createdBy: new Types.ObjectId(userId),
    });

    logger.info(`[EVENTS] Event "${event.title}" created with status ${event.status} by user ${userId}`);
    return event;
  }

  /**
   * 5. Teacher: Update Event
   */
  async updateEvent(userId: string, eventId: string, data: any, isAdmin = false): Promise<ICampusEvent> {
    const event = await CampusEvent.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!isAdmin && event.createdBy.toString() !== userId) {
      throw new AppError('You do not have permission to edit this event', 403);
    }

    if (event.status === 'CANCELLED') {
      throw new AppError('Cannot edit a cancelled event', 400);
    }

    const wasPublished = event.status === 'PUBLISHED';
    const oldStart = event.startDateTime;

    if (data.title && data.title !== event.title) {
      event.title = data.title;
      event.slug = this.generateSlug(data.title);
    }

    // Apply allowed updates
    const fieldsToUpdate = [
      'category',
      'shortDescription',
      'description',
      'bannerUrl',
      'timezone',
      'mode',
      'campusBlock',
      'venue',
      'roomNumber',
      'onlinePlatform',
      'publicMeetingUrl',
      'organizerName',
      'organizerDepartment',
      'speakerDetails',
      'registrationEnabled',
      'registrationUrl',
      'capacity',
      'contactEmail',
      'contactPhone',
      'additionalInstructions',
    ];

    fieldsToUpdate.forEach((field) => {
      if (data[field] !== undefined) {
        (event as any)[field] = data[field];
      }
    });

    if (data.startDateTime) event.startDateTime = new Date(data.startDateTime);
    if (data.endDateTime) event.endDateTime = new Date(data.endDateTime);
    if (data.registrationDeadline) event.registrationDeadline = new Date(data.registrationDeadline);

    event.updatedBy = new Types.ObjectId(userId);
    await event.save();

    // If date changed on a published event, notify registered attendees
    if (wasPublished && data.startDateTime && new Date(data.startDateTime).getTime() !== oldStart.getTime()) {
      this.notifyEventUpdate(event, 'Event Schedule Updated', `The schedule for "${event.title}" has been updated.`);
    }

    return event;
  }

  /**
   * 6. Teacher: Publish Draft Event
   */
  async publishEvent(userId: string, eventId: string, isAdmin = false): Promise<ICampusEvent> {
    const event = await CampusEvent.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    if (!isAdmin && event.createdBy.toString() !== userId) {
      throw new AppError('You do not have permission to publish this event', 403);
    }

    if (event.status === 'PUBLISHED') {
      return event;
    }

    event.status = 'PUBLISHED';
    event.publishedAt = new Date();
    event.updatedBy = new Types.ObjectId(userId);
    await event.save();

    logger.info(`[EVENTS] Event "${event.title}" (${event._id}) published.`);
    return event;
  }

  /**
   * 7. Teacher / Admin: Cancel Event
   */
  async cancelEvent(userId: string, eventId: string, reason: string, isAdmin = false): Promise<ICampusEvent> {
    const event = await CampusEvent.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    if (!isAdmin && event.createdBy.toString() !== userId) {
      throw new AppError('You do not have permission to cancel this event', 403);
    }

    event.status = 'CANCELLED';
    event.cancelledAt = new Date();
    event.cancellationReason = reason.trim();
    event.updatedBy = new Types.ObjectId(userId);
    await event.save();

    // Notify all registered participants
    this.notifyEventUpdate(
      event,
      `[Cancelled] ${event.title}`,
      `The event "${event.title}" scheduled for ${event.startDateTime.toLocaleDateString()} has been cancelled. Reason: ${reason}`
    );

    logger.info(`[EVENTS] Event "${event.title}" (${event._id}) cancelled. Reason: ${reason}`);
    return event;
  }

  /**
   * 8. Teacher: Delete Draft Event
   */
  async deleteDraft(userId: string, eventId: string, isAdmin = false): Promise<void> {
    const event = await CampusEvent.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    if (!isAdmin && event.createdBy.toString() !== userId) {
      throw new AppError('You do not have permission to delete this event', 403);
    }

    if (event.status !== 'DRAFT') {
      throw new AppError('Only draft events can be deleted. Published events must be cancelled.', 400);
    }

    await CampusEvent.findByIdAndDelete(eventId);
    logger.info(`[EVENTS] Draft event ${eventId} deleted.`);
  }

  /**
   * 9. Teacher: Get My Managed Events
   */
  async getMyEvents(
    userId: string,
    params?: { status?: string; search?: string }
  ): Promise<{ events: ICampusEvent[]; stats: any }> {
    const query: any = { createdBy: new Types.ObjectId(userId) };

    if (params?.status && params.status !== 'ALL') {
      query.status = params.status;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    const events = await CampusEvent.find(query).sort({ createdAt: -1 });

    const allMyEvents = await CampusEvent.find({ createdBy: new Types.ObjectId(userId) });
    const now = new Date();

    const stats = {
      totalEvents: allMyEvents.length,
      publishedCount: allMyEvents.filter((e) => e.status === 'PUBLISHED').length,
      draftCount: allMyEvents.filter((e) => e.status === 'DRAFT').length,
      cancelledCount: allMyEvents.filter((e) => e.status === 'CANCELLED').length,
      upcomingCount: allMyEvents.filter((e) => e.status === 'PUBLISHED' && e.startDateTime >= now).length,
      totalRegistrations: allMyEvents.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0),
    };

    return { events, stats };
  }

  /**
   * 10. Authenticated User: Register for Event
   */
  async registerForEvent(userId: string, eventId: string): Promise<IEventRegistration> {
    const event = await CampusEvent.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    if (event.status !== 'PUBLISHED') {
      throw new AppError(`Cannot register for an event that is ${event.status.toLowerCase()}`, 400);
    }

    if (!event.registrationEnabled) {
      throw new AppError('Online registration is not enabled for this event', 400);
    }

    const now = new Date();
    if (event.registrationDeadline && now > event.registrationDeadline) {
      throw new AppError('The registration deadline for this event has passed', 400);
    }

    if (now > event.endDateTime) {
      throw new AppError('This event has already concluded', 400);
    }

    // Check existing registration
    const existing = await EventRegistration.findOne({
      event: event._id,
      user: new Types.ObjectId(userId),
    });

    if (existing && existing.status === 'REGISTERED') {
      throw new AppError('You are already registered for this event', 400);
    }

    // Check capacity atomically
    if (event.capacity > 0 && event.registeredCount >= event.capacity) {
      throw new AppError('This event has reached full capacity', 400);
    }

    // Atomic increment
    const updatedEvent = await CampusEvent.findOneAndUpdate(
      {
        _id: event._id,
        $or: [{ capacity: 0 }, { registeredCount: { $lt: event.capacity } }],
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      throw new AppError('This event has just reached full capacity', 400);
    }

    let registration: IEventRegistration;
    if (existing) {
      existing.status = 'REGISTERED';
      existing.registeredAt = new Date();
      existing.cancelledAt = undefined;
      await existing.save();
      registration = existing;
    } else {
      registration = await EventRegistration.create({
        event: event._id,
        user: new Types.ObjectId(userId),
        status: 'REGISTERED',
        registeredAt: new Date(),
      });
    }

    // Create confirmation notification
    const userDoc = await User.findById(userId);
    if (userDoc) {
      await Notification.create({
        recipient: userDoc._id,
        type: 'EVENT_REGISTRATION_CONFIRMED',
        title: 'Event Registration Confirmed',
        message: `You are confirmed for "${event.title}" on ${event.startDateTime.toLocaleDateString()}.`,
        metadata: { eventId: event._id },
      });
      emitToUser(userId, 'notification', {
        type: 'EVENT_REGISTRATION_CONFIRMED',
        message: `Registered for ${event.title}`,
      });
    }

    return registration;
  }

  /**
   * 11. Authenticated User: Cancel Registration
   */
  async unregisterFromEvent(userId: string, eventId: string): Promise<void> {
    const registration = await EventRegistration.findOne({
      event: new Types.ObjectId(eventId),
      user: new Types.ObjectId(userId),
      status: 'REGISTERED',
    });

    if (!registration) {
      throw new AppError('You are not registered for this event', 400);
    }

    registration.status = 'CANCELLED';
    registration.cancelledAt = new Date();
    await registration.save();

    // Decrement registeredCount
    await CampusEvent.findByIdAndUpdate(eventId, {
      $inc: { registeredCount: -1 },
    });

    // Confirmation notification
    await Notification.create({
      recipient: new Types.ObjectId(userId),
      type: 'EVENT_REGISTRATION_CANCELLED',
      title: 'Registration Cancelled',
      message: 'Your registration has been cancelled successfully.',
      metadata: { eventId },
    });
  }

  /**
   * 12. Organizers / Admin: View Registered Attendees
   */
  async getEventRegistrations(
    userId: string,
    eventId: string,
    isAdmin = false
  ): Promise<{ registrations: IEventRegistration[]; total: number }> {
    const event = await CampusEvent.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    if (!isAdmin && event.createdBy.toString() !== userId) {
      throw new AppError('Access denied: You can only view attendees for events you organized', 403);
    }

    const registrations = await EventRegistration.find({
      event: event._id,
      status: 'REGISTERED',
    })
      .populate('user', 'fullName email uid role department avatarUrl')
      .sort({ registeredAt: -1 });

    return {
      registrations,
      total: registrations.length,
    };
  }

  /**
   * 13. Authenticated User: View My Event Registrations
   */
  async getMyRegistrations(userId: string): Promise<any[]> {
    const registrations = await EventRegistration.find({
      user: new Types.ObjectId(userId),
      status: 'REGISTERED',
    })
      .populate({
        path: 'event',
        select: 'title category startDateTime endDateTime mode venue campusBlock onlinePlatform bannerUrl status',
      })
      .sort({ registeredAt: -1 });

    return registrations;
  }

  /**
   * Helper: Broadcast notification to all registered attendees of an event
   */
  private async notifyEventUpdate(event: ICampusEvent, title: string, message: string): Promise<void> {
    try {
      const activeRegistrations = await EventRegistration.find({
        event: event._id,
        status: 'REGISTERED',
      }).select('user');

      const notifications = activeRegistrations.map((reg) => ({
        recipient: reg.user,
        type: event.status === 'CANCELLED' ? 'EVENT_CANCELLED' : 'EVENT_UPDATED',
        title,
        message,
        metadata: { eventId: event._id },
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        activeRegistrations.forEach((reg) => {
          emitToUser(reg.user.toString(), 'notification', { type: 'EVENT_NOTIFICATION', message });
        });
      }
    } catch (err) {
      logger.error('[EVENTS] Failed to broadcast event update notifications:', err);
    }
  }

  /**
   * 14. Idempotent Scheduled Reminders (24H and 1H)
   */
  async processEventReminders(): Promise<{ sent24H: number; sent1H: number }> {
    const now = new Date();
    let sent24H = 0;
    let sent1H = 0;

    // 24 Hours Window: events starting between 23 and 25 hours from now
    const win24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const win24End = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const events24H = await CampusEvent.find({
      status: 'PUBLISHED',
      startDateTime: { $gte: win24Start, $lte: win24End },
    });

    for (const ev of events24H) {
      const registrations = await EventRegistration.find({
        event: ev._id,
        status: 'REGISTERED',
      });

      for (const reg of registrations) {
        try {
          // Idempotent upsert
          const log = await EventReminderLog.findOne({
            event: ev._id,
            user: reg.user,
            reminderType: '24H',
          });

          if (!log) {
            await EventReminderLog.create({
              event: ev._id,
              user: reg.user,
              reminderType: '24H',
            });

            await Notification.create({
              recipient: reg.user,
              type: 'EVENT_REMINDER_24H',
              title: `[Tomorrow] ${ev.title}`,
              message: `Reminder: "${ev.title}" is happening tomorrow at ${ev.startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              metadata: { eventId: ev._id },
            });

            emitToUser(reg.user.toString(), 'notification', {
              type: 'EVENT_REMINDER_24H',
              message: `Event tomorrow: ${ev.title}`,
            });

            sent24H++;
          }
        } catch {}
      }
    }

    // 1 Hour Window: events starting between 50 and 70 minutes from now
    const win1Start = new Date(now.getTime() + 50 * 60 * 1000);
    const win1End = new Date(now.getTime() + 70 * 60 * 1000);

    const events1H = await CampusEvent.find({
      status: 'PUBLISHED',
      startDateTime: { $gte: win1Start, $lte: win1End },
    });

    for (const ev of events1H) {
      const registrations = await EventRegistration.find({
        event: ev._id,
        status: 'REGISTERED',
      });

      for (const reg of registrations) {
        try {
          const log = await EventReminderLog.findOne({
            event: ev._id,
            user: reg.user,
            reminderType: '1H',
          });

          if (!log) {
            await EventReminderLog.create({
              event: ev._id,
              user: reg.user,
              reminderType: '1H',
            });

            await Notification.create({
              recipient: reg.user,
              type: 'EVENT_REMINDER_1H',
              title: `[In 1 Hour] ${ev.title}`,
              message: `"${ev.title}" starts in 1 hour. Get ready!`,
              metadata: { eventId: ev._id },
            });

            emitToUser(reg.user.toString(), 'notification', {
              type: 'EVENT_REMINDER_1H',
              message: `Event in 1 hour: ${ev.title}`,
            });

            sent1H++;
          }
        } catch {}
      }
    }

    return { sent24H, sent1H };
  }
}

export const eventService = new EventService();
