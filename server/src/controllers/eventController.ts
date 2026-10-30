import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService';
import {
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
  eventQuerySchema,
} from '../validators/eventValidators';

export class EventController {
  /**
   * GET /api/v1/events (Public)
   */
  async listPublicEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = eventQuerySchema.parse(req.query);
      const result = await eventService.listPublicEvents(parsed);
      res.json({
        success: true,
        data: result.events,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/featured (Public)
   */
  async getFeaturedEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await eventService.getFeaturedEvents();
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/:id (Public, with optional user registration context)
   */
  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const result = await eventService.getPublicEventById(req.params.id, userId);
      res.json({
        success: true,
        data: {
          ...result.event.toObject(),
          isRegistered: result.isRegistered,
          registration: result.registration,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events (Teacher & Admin only)
   */
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(userId, validated);
      res.status(201).json({
        success: true,
        message: event.status === 'PUBLISHED' ? 'Event published successfully.' : 'Event draft saved.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/events/:id (Teacher & Admin)
   */
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const validated = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(userId, req.params.id, validated, isAdmin);
      res.json({
        success: true,
        message: 'Event updated successfully.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events/:id/publish (Teacher & Admin)
   */
  async publishEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const event = await eventService.publishEvent(userId, req.params.id, isAdmin);
      res.json({
        success: true,
        message: 'Event published to public university calendar.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events/:id/cancel (Teacher & Admin)
   */
  async cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const { reason } = cancelEventSchema.parse(req.body);
      const event = await eventService.cancelEvent(userId, req.params.id, reason, isAdmin);
      res.json({
        success: true,
        message: 'Event cancelled and attendees notified.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/events/:id (Teacher & Admin - drafts only)
   */
  async deleteDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      await eventService.deleteDraft(userId, req.params.id, isAdmin);
      res.json({
        success: true,
        message: 'Draft event deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/mine (Teacher & Admin)
   */
  async getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const result = await eventService.getMyEvents(userId, { status, search });
      res.json({
        success: true,
        data: result.events,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events/:id/register (Authenticated students & teachers)
   */
  async registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const registration = await eventService.registerForEvent(userId, req.params.id);
      res.status(201).json({
        success: true,
        message: 'Successfully registered for this event.',
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events/:id/unregister (Authenticated)
   */
  async unregisterFromEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await eventService.unregisterFromEvent(userId, req.params.id);
      res.json({
        success: true,
        message: 'Event registration cancelled successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/:id/registrations (Organizers & Admin)
   */
  async getEventRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const isAdmin = req.user!.role === 'ADMIN';
      const result = await eventService.getEventRegistrations(userId, req.params.id, isAdmin);
      res.json({
        success: true,
        data: result.registrations,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/events/my-registrations (Authenticated)
   */
  async getMyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const registrations = await eventService.getMyRegistrations(userId);
      res.json({
        success: true,
        data: registrations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/events/reminders/process (Admin / Internal trigger)
   */
  async processReminders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await eventService.processEventReminders();
      res.json({
        success: true,
        message: 'Event reminders processed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();
