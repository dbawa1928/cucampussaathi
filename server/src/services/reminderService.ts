import { Appointment } from '../models/Appointment';
import { notificationService } from './notificationService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

export class ReminderService {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Scan for upcoming accepted consultations and generate notifications for both student and teacher.
   * Idempotent: Skips appointments where reminderSentAt is already set.
   * Excludes CANCELLED, REJECTED, and COMPLETED appointments.
   */
  async processUpcomingReminders(hoursAhead: number = 24): Promise<number> {
    if (this.isProcessing) {
      return 0;
    }
    this.isProcessing = true;

    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      // Find accepted appointments that haven't received a reminder yet
      const candidateAppointments = await Appointment.find({
        status: 'ACCEPTED',
        reminderSentAt: { $exists: false },
      })
        .populate('slot')
        .populate({
          path: 'teacherProfile',
          populate: { path: 'user', select: 'fullName email' },
        })
        .populate('student', 'fullName email');

      let remindersSent = 0;

      for (const appointment of candidateAppointments) {
        const slot = appointment.slot as any;
        if (!slot || !slot.startTime) continue;

        const startTime = new Date(slot.startTime);

        // Check if meeting is in the future and within reminder horizon
        if (startTime > now && startTime <= horizon) {
          const student = appointment.student as any;
          const teacherProfile = appointment.teacherProfile as any;
          const teacherUser = teacherProfile?.user;

          if (!student || !teacherUser) continue;

          const formattedTime = startTime.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          // Mark reminderSentAt first to prevent duplicate sends on concurrent/retry passes
          appointment.reminderSentAt = new Date();
          await appointment.save();

          // 1. Notify Student
          try {
            await notificationService.createNotification({
              recipient: student._id.toString(),
              type: 'CONSULTATION_REMINDER',
              title: 'Upcoming Faculty Consultation',
              message: `Reminder: You have an upcoming consultation with ${teacherUser.fullName} on ${formattedTime}.`,
              relatedAppointment: appointment._id,
            });
          } catch (err: any) {
            logger.warn(`Failed to send student reminder: ${err.message}`);
          }

          // 2. Notify Teacher
          try {
            await notificationService.createNotification({
              recipient: teacherUser._id.toString(),
              type: 'CONSULTATION_REMINDER',
              title: 'Upcoming Student Consultation',
              message: `Reminder: You have an upcoming consultation with ${student.fullName} on ${formattedTime}.`,
              relatedAppointment: appointment._id,
            });
          } catch (err: any) {
            logger.warn(`Failed to send teacher reminder: ${err.message}`);
          }

          // 3. Email Reminders (idempotent with EmailLog)
          try {
            const dateStr = startTime.toLocaleDateString('en-IN', { dateStyle: 'medium' });
            const timeStr = startTime.toLocaleTimeString('en-IN', { timeStyle: 'short' });
            const locationOrLink =
              appointment.meetingLink ||
              (appointment.campusBlock ? `Block ${appointment.campusBlock}` : undefined);

            await emailService.sendConsultationReminderEmail({
              recipientEmail: student.email,
              recipientName: student.fullName,
              recipientRole: 'STUDENT',
              otherPartyName: `Prof. ${teacherUser.fullName}`,
              reminderType: '24h',
              appointmentDate: dateStr,
              appointmentTime: timeStr,
              meetingMode: appointment.meetingMode,
              locationOrLink,
              appointmentId: appointment._id.toString(),
            });

            await emailService.sendConsultationReminderEmail({
              recipientEmail: teacherUser.email,
              recipientName: teacherUser.fullName,
              recipientRole: 'TEACHER',
              otherPartyName: student.fullName,
              reminderType: '24h',
              appointmentDate: dateStr,
              appointmentTime: timeStr,
              meetingMode: appointment.meetingMode,
              locationOrLink,
              appointmentId: appointment._id.toString(),
            });
          } catch (emailErr: any) {
            logger.warn(`Failed to dispatch reminder emails: ${emailErr.message}`);
          }

          remindersSent++;
        }
      }

      if (remindersSent > 0) {
        logger.info(`Processed ${remindersSent} upcoming consultation reminder(s).`);
      }

      return remindersSent;
    } catch (err: any) {
      logger.error('Error processing consultation reminders', err);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start recurring background reminder worker.
   */
  startReminderScheduler(intervalMs: number = 10 * 60 * 1000, hoursAhead: number = 24): void {
    if (this.timer) {
      return;
    }

    logger.info(`Starting consultation reminder scheduler (runs every ${Math.round(intervalMs / 1000)}s)`);

    // Run initial scan
    this.processUpcomingReminders(hoursAhead).catch(() => {});

    // Schedule periodic scans
    this.timer = setInterval(() => {
      this.processUpcomingReminders(hoursAhead).catch(() => {});
    }, intervalMs);

    // Prevent timer from keeping the Node.js event loop alive on shutdown
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Stop recurring scheduler.
   */
  stopReminderScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Consultation reminder scheduler stopped.');
    }
  }
}

export const reminderService = new ReminderService();
