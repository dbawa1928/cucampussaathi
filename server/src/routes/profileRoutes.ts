import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Student Profile Endpoints
router.get(
  '/student',
  authGuard,
  roleGuard('STUDENT'),
  profileController.getStudentProfile.bind(profileController)
);

router.put(
  '/student',
  authGuard,
  roleGuard('STUDENT'),
  profileController.updateStudentProfile.bind(profileController)
);

// Teacher Profile Endpoints
router.get(
  '/teacher',
  authGuard,
  roleGuard('TEACHER'),
  profileController.getTeacherProfile.bind(profileController)
);

router.put(
  '/teacher',
  authGuard,
  roleGuard('TEACHER'),
  profileController.updateTeacherProfile.bind(profileController)
);

export default router;
