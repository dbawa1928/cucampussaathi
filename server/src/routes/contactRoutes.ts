import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContactMessage } from '../models/ContactMessage';
import { contactRateLimiter } from '../middleware/rateLimiter';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().trim().email('Please provide a valid email address'),
  userType: z.enum(['Student', 'Faculty', 'Other']).default('Student'),
  subject: z.string().trim().min(2, 'Subject must be at least 2 characters').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the privacy guidelines.',
  }),
});

router.post(
  '/',
  contactRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = contactSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Contact validation failed', parseResult.error.format());
      }

      const { fullName, email, userType, subject, message } = parseResult.data;

      const mappedUserType =
        userType === 'Faculty' ? 'FACULTY' : userType === 'Other' ? 'OTHER' : 'STUDENT';

      const contactRecord = await ContactMessage.create({
        fullName,
        email,
        userType: mappedUserType,
        subject,
        message,
        status: 'NEW',
        ipAddress: req.ip,
      });

      logger.info(`[CONTACT] New inquiry received from ${email} (Ticket ID: ${contactRecord._id})`);

      res.status(201).json({
        success: true,
        message: 'Your message has been received. Chandigarh University support will contact you shortly.',
        data: {
          ticketId: contactRecord._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

