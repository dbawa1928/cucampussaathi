import { Router } from 'express';
import { teacherRestrictionController } from '../controllers/teacherRestrictionController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Teacher blocks a student
router.post(
  '/block',
  authGuard,
  roleGuard('TEACHER'),
  teacherRestrictionController.blockStudent.bind(teacherRestrictionController)
);

// Teacher unblocks a student (supporting both /unblock and /unblock/:studentId)
router.post(
  '/unblock',
  authGuard,
  roleGuard('TEACHER'),
  teacherRestrictionController.unblockStudent.bind(teacherRestrictionController)
);

router.post(
  '/unblock/:studentId',
  authGuard,
  roleGuard('TEACHER'),
  teacherRestrictionController.unblockStudent.bind(teacherRestrictionController)
);

// Teacher lists all their blocked students (supporting both / and /blocked)
router.get(
  '/',
  authGuard,
  roleGuard('TEACHER'),
  teacherRestrictionController.getBlockedStudents.bind(teacherRestrictionController)
);

router.get(
  '/blocked',
  authGuard,
  roleGuard('TEACHER'),
  teacherRestrictionController.getBlockedStudents.bind(teacherRestrictionController)
);

// Check if authenticated student is blocked by target teacher
router.get(
  '/check/:teacherId',
  authGuard,
  teacherRestrictionController.checkRestriction.bind(teacherRestrictionController)
);

export default router;
