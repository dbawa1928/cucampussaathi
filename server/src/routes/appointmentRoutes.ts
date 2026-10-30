import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { rescheduleController } from '../controllers/rescheduleController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Student books a slot
router.post(
  '/',
  authGuard,
  roleGuard('STUDENT'),
  appointmentController.bookAppointment.bind(appointmentController)
);

// View personal appointments (Student or Teacher)
router.get(
  '/mine',
  authGuard,
  appointmentController.getMyAppointments.bind(appointmentController)
);

// Student attendance history & metrics
router.get(
  '/attendance/history',
  authGuard,
  roleGuard('STUDENT'),
  appointmentController.getAttendanceHistory.bind(appointmentController)
);

// View specific appointment details
router.get(
  '/:appointmentId',
  authGuard,
  appointmentController.getAppointmentById.bind(appointmentController)
);

// Cancel appointment (Student or Teacher)
router.post(
  '/:appointmentId/cancel',
  authGuard,
  appointmentController.cancelAppointment.bind(appointmentController)
);

// Teacher-only state machine transitions
router.post(
  '/:appointmentId/accept',
  authGuard,
  roleGuard('TEACHER'),
  appointmentController.acceptAppointment.bind(appointmentController)
);

router.post(
  '/:appointmentId/reject',
  authGuard,
  roleGuard('TEACHER'),
  appointmentController.rejectAppointment.bind(appointmentController)
);

router.post(
  '/:appointmentId/complete',
  authGuard,
  roleGuard('TEACHER'),
  appointmentController.completeAppointment.bind(appointmentController)
);

// Teacher marks attendance (ATTENDED or NO_SHOW)
router.post(
  '/:appointmentId/attendance',
  authGuard,
  roleGuard('TEACHER'),
  appointmentController.markAttendance.bind(appointmentController)
);

// Student appeals a no-show mark
router.post(
  '/:appointmentId/appeal',
  authGuard,
  roleGuard('STUDENT'),
  appointmentController.appealNoShow.bind(appointmentController)
);

router.post(
  '/:appointmentId/appeal-no-show',
  authGuard,
  roleGuard('STUDENT'),
  appointmentController.appealNoShow.bind(appointmentController)
);

// Admin reviews a no-show appeal
router.post(
  '/:appointmentId/appeal-review',
  authGuard,
  roleGuard('ADMIN'),
  appointmentController.reviewNoShowAppeal.bind(appointmentController)
);

router.post(
  '/:appointmentId/review-appeal',
  authGuard,
  roleGuard('ADMIN'),
  appointmentController.reviewNoShowAppeal.bind(appointmentController)
);

// Teacher or Admin updates meeting details (Online link, cabin instructions)
router.patch(
  '/:appointmentId/meeting-details',
  authGuard,
  appointmentController.updateMeetingDetails.bind(appointmentController)
);

// Reschedule proposals for an appointment (Student or Teacher)
router.post(
  '/:appointmentId/reschedule-proposals',
  authGuard,
  rescheduleController.proposeReschedule.bind(rescheduleController)
);

router.get(
  '/:appointmentId/reschedule-proposals',
  authGuard,
  rescheduleController.getProposals.bind(rescheduleController)
);

export default router;
