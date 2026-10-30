import { Router } from 'express';
import { availabilityController } from '../controllers/availabilityController';
import { authGuard, roleGuard, optionalAuthGuard } from '../middleware/authGuard';

const router = Router();

// Teacher consultation slot management
router.post(
  '/',
  authGuard,
  roleGuard('TEACHER'),
  availabilityController.createSlot.bind(availabilityController)
);

router.get(
  '/mine',
  authGuard,
  roleGuard('TEACHER'),
  availabilityController.getMySlots.bind(availabilityController)
);

// Public / student lookup for a teacher's upcoming available slots
router.get(
  '/teacher/:teacherProfileId',
  optionalAuthGuard,
  availabilityController.getTeacherPublicSlots.bind(availabilityController)
);

router.put(
  '/:slotId',
  authGuard,
  roleGuard('TEACHER'),
  availabilityController.updateSlot.bind(availabilityController)
);

router.delete(
  '/:slotId',
  authGuard,
  roleGuard('TEACHER'),
  availabilityController.deleteSlot.bind(availabilityController)
);

export default router;
