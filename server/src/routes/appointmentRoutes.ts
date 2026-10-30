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
