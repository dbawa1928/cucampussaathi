import { Router } from 'express';
import { eventController } from '../controllers/eventController';
import { authGuard, optionalAuthGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Public Routes (Accessible without login)
router.get('/', eventController.listPublicEvents.bind(eventController));
router.get('/featured', eventController.getFeaturedEvents.bind(eventController));
router.get('/:id', optionalAuthGuard, eventController.getEventById.bind(eventController));

// Authenticated Student & Teacher Registration Routes
router.post('/:id/register', authGuard, eventController.registerForEvent.bind(eventController));
router.post('/:id/unregister', authGuard, eventController.unregisterFromEvent.bind(eventController));
router.get('/my/registrations', authGuard, eventController.getMyRegistrations.bind(eventController));

// Teacher & Admin Management Routes
router.post(
  '/',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.createEvent.bind(eventController)
);

router.get(
  '/manage/mine',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.getMyEvents.bind(eventController)
);

router.patch(
  '/:id',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.updateEvent.bind(eventController)
);

router.post(
  '/:id/publish',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.publishEvent.bind(eventController)
);

router.post(
  '/:id/cancel',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.cancelEvent.bind(eventController)
);

router.delete(
  '/:id',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.deleteDraft.bind(eventController)
);

router.get(
  '/:id/registrations',
  authGuard,
  roleGuard('TEACHER', 'ADMIN'),
  eventController.getEventRegistrations.bind(eventController)
);

// Admin-only Reminders Trigger
router.post(
  '/reminders/process',
  authGuard,
  roleGuard('ADMIN'),
  eventController.processReminders.bind(eventController)
);

export default router;
