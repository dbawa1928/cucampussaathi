import nodemailer, { type Transporter } from 'nodemailer';
import { EmailLog } from '../models/EmailLog';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  recipientRole?: string;
  subject: string;
  templateType: string;
  html: string;
  text?: string;
  appointmentId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        this.isConfigured = true;
        logger.info(`[EMAIL] SMTP transporter initialized for host: ${host}:${port}`);
      } catch (err) {
        logger.error('[EMAIL] Failed to initialize SMTP transporter', err);
      }
    } else {
      logger.info('[EMAIL] SMTP credentials not provided. Operating in safe MOCK/LOG mode.');
    }
  }

  /**
   * Send an email with idempotency and audit logging.
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const {
      to,
      recipientRole = 'STUDENT',
      subject,
      templateType,
      html,
      text,
      appointmentId,
      idempotencyKey,
      metadata,
    } = options;

    // Check idempotency if a key is provided
    if (idempotencyKey) {
      const existing = await EmailLog.findOne({ idempotencyKey, status: { $in: ['SENT', 'MOCKED'] } });
      if (existing) {
        logger.info(`[EMAIL] Email with idempotencyKey "${idempotencyKey}" already processed. Skipping duplicate.`);
        return true;
      }
    }

    const from = process.env.SMTP_FROM || '"CUCampusSaathi" <noreply@cuchd.in>';

    if (!this.isConfigured || !this.transporter) {
      // Safe mock logging (used during tests and when SMTP is not configured in dev)
      logger.info(`[EMAIL:MOCKED] To: ${to} | Subject: "${subject}" | Template: ${templateType}`);
      try {
        await EmailLog.create({
          recipient: to,
          recipientRole,
          subject,
          templateType,
          appointment: appointmentId,
          status: 'MOCKED',
          idempotencyKey,
          metadata,
        });
      } catch (dbErr: any) {
        if (dbErr.code !== 11000) {
          logger.error('[EMAIL] Failed to record mocked email log', dbErr);
        }
      }
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''),
      });

      logger.info(`[EMAIL:SENT] To: ${to} | Subject: "${subject}"`);

      await EmailLog.create({
        recipient: to,
        recipientRole,
        subject,
        templateType,
        appointment: appointmentId,
        status: 'SENT',
        idempotencyKey,
        metadata,
      });

      return true;
    } catch (err: any) {
      logger.error(`[EMAIL:FAILED] Failed to send email to ${to}: ${err.message}`);

      try {
        await EmailLog.create({
          recipient: to,
          recipientRole,
          subject,
          templateType,
          appointment: appointmentId,
          status: 'FAILED',
          error: err.message,
          idempotencyKey,
          metadata,
        });
      } catch (logErr) {
        logger.error('[EMAIL] Failed to log failed email attempt', logErr);
      }

      // Do not rethrow: Email failures should not crash user booking or operations
      return false;
    }
  }

  // 1. Student books consultation -> Faculty email
  async sendBookingRequestToFaculty(params: {
    facultyEmail: string;
    facultyName: string;
    studentName: string;
    studentUid: string;
    studentDepartment: string;
    appointmentDate: string;
    appointmentTime: string;
    meetingMode: string;
    agenda: string;
    appointmentId: string;
  }) {
    const subject = `[CUCampusSaathi] New Consultation Request from ${params.studentName} (${params.studentUid})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #C62828; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">CUCampusSaathi</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">Faculty Consultation Management</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>Prof. ${params.facultyName}</strong>,</p>
          <p>You have received a new student consultation request:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; color: #666;">Student:</td><td><strong>${params.studentName} (${params.studentUid})</strong></td></tr>
            <tr><td style="padding: 6px; color: #666;">Department:</td><td>${params.studentDepartment}</td></tr>
            <tr><td style="padding: 6px; color: #666;">Date & Time:</td><td><strong>${params.appointmentDate} at ${params.appointmentTime}</strong></td></tr>
            <tr><td style="padding: 6px; color: #666;">Mode:</td><td><strong style="color: #C62828;">${params.meetingMode}</strong></td></tr>
          </table>
          <div style="background: #FFF1F1; padding: 12px; border-left: 4px solid #C62828; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #8E1717;">Student Discussion Agenda:</p>
            <p style="margin: 6px 0 0; font-size: 13px; color: #252525; white-space: pre-wrap;">${params.agenda}</p>
          </div>
          <p style="font-size: 13px; color: #666;">Please sign in to your CUCampusSaathi Faculty Dashboard to approve or reject this request.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.facultyEmail,
      recipientRole: 'TEACHER',
      subject,
      templateType: 'BOOKING_REQUEST',
      html,
      appointmentId: params.appointmentId,
    });
  }

  // 2. Faculty approves -> Student email
  async sendBookingApprovedToStudent(params: {
    studentEmail: string;
    studentName: string;
    facultyName: string;
    appointmentDate: string;
    appointmentTime: string;
    meetingMode: string;
    locationInfo?: string;
    meetingLink?: string;
    appointmentId: string;
  }) {
    const subject = `[Confirmed] Consultation with Prof. ${params.facultyName} has been Approved`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #C62828; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Consultation Confirmed</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">CUCampusSaathi Academic Mentorship</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>Your consultation appointment with <strong>Prof. ${params.facultyName}</strong> has been officially approved!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; color: #666;">Scheduled:</td><td><strong>${params.appointmentDate} at ${params.appointmentTime}</strong></td></tr>
            <tr><td style="padding: 6px; color: #666;">Format:</td><td><strong>${params.meetingMode}</strong></td></tr>
            ${params.locationInfo ? `<tr><td style="padding: 6px; color: #666;">Campus Location:</td><td><strong>${params.locationInfo}</strong></td></tr>` : ''}
            ${params.meetingLink ? `<tr><td style="padding: 6px; color: #666;">Meeting Link:</td><td><a href="${params.meetingLink}" style="color: #C62828;">${params.meetingLink}</a></td></tr>` : ''}
          </table>
          <p style="font-size: 12px; color: #888;">Please ensure prompt attendance. If you cannot attend, cancel well in advance to avoid a no-show record.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.studentEmail,
      recipientRole: 'STUDENT',
      subject,
      templateType: 'BOOKING_APPROVED',
      html,
      appointmentId: params.appointmentId,
    });
  }

  // 3. Faculty rejects -> Student email
  async sendBookingRejectedToStudent(params: {
    studentEmail: string;
    studentName: string;
    facultyName: string;
    rejectionReason: string;
    appointmentId: string;
  }) {
    const subject = `[Update] Consultation Request with Prof. ${params.facultyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #8E1717; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Consultation Request Update</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>Prof. ${params.facultyName} was unable to accept your consultation request.</p>
          <div style="background: #FFF1F1; padding: 12px; border-left: 4px solid #C62828; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #8E1717;">Reason:</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #252525;">${params.rejectionReason}</p>
          </div>
          <p style="font-size: 13px; color: #666;">The slot has been released. You may choose another available slot or connect with other faculty members.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.studentEmail,
      recipientRole: 'STUDENT',
      subject,
      templateType: 'BOOKING_REJECTED',
      html,
      appointmentId: params.appointmentId,
    });
  }

  // 4. Appointment cancelled -> Both participants
  async sendBookingCancelledEmail(params: {
    recipientEmail: string;
    recipientName: string;
    cancelledByName: string;
    reason?: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentId: string;
  }) {
    const subject = `[Cancelled] Consultation Appointment on ${params.appointmentDate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #8E1717; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Consultation Cancelled</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.recipientName}</strong>,</p>
          <p>The consultation scheduled for <strong>${params.appointmentDate} at ${params.appointmentTime}</strong> has been cancelled by ${params.cancelledByName}.</p>
          ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
          <p style="font-size: 13px; color: #666;">The calendar slot has been freed.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.recipientEmail,
      subject,
      templateType: 'BOOKING_CANCELLED',
      html,
      appointmentId: params.appointmentId,
    });
  }

  // 5. Consultation reminders (24h or 1h) with idempotencyKey
  async sendConsultationReminderEmail(params: {
    recipientEmail: string;
    recipientName: string;
    recipientRole: string;
    otherPartyName: string;
    reminderType: '24h' | '1h';
    appointmentDate: string;
    appointmentTime: string;
    meetingMode: string;
    locationOrLink?: string;
    appointmentId: string;
  }) {
    const idempotencyKey = `reminder-${params.reminderType}-${params.appointmentId}-${params.recipientEmail}`;
    const subject = `[Reminder - In ${params.reminderType === '24h' ? '24 Hours' : '1 Hour'}] Consultation with ${params.otherPartyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #C62828; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Upcoming Consultation Reminder</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.recipientName}</strong>,</p>
          <p>This is a friendly reminder that your consultation with <strong>${params.otherPartyName}</strong> takes place in approximately ${params.reminderType === '24h' ? '24 hours' : '1 hour'}:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; color: #666;">Time:</td><td><strong>${params.appointmentDate} at ${params.appointmentTime}</strong></td></tr>
            <tr><td style="padding: 6px; color: #666;">Mode:</td><td><strong>${params.meetingMode}</strong></td></tr>
            ${params.locationOrLink ? `<tr><td style="padding: 6px; color: #666;">Details:</td><td><strong>${params.locationOrLink}</strong></td></tr>` : ''}
          </table>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.recipientEmail,
      recipientRole: params.recipientRole,
      subject,
      templateType: `REMINDER_${params.reminderType.toUpperCase()}`,
      html,
      appointmentId: params.appointmentId,
      idempotencyKey,
    });
  }

  // 6. Student marked NO_SHOW -> Student email
  async sendStudentNoShowEmail(params: {
    studentEmail: string;
    studentName: string;
    facultyName: string;
    appointmentDate: string;
    noShowReason: string;
    appointmentId: string;
  }) {
    const subject = `[Attendance Notice] Consultation Marked as No-Show by Prof. ${params.facultyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #8E1717; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Attendance Record: No-Show</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>Your consultation with <strong>Prof. ${params.facultyName}</strong> on <strong>${params.appointmentDate}</strong> was marked as <strong>NO-SHOW</strong>.</p>
          <div style="background: #FFF1F1; padding: 12px; border-left: 4px solid #C62828; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #8E1717;">Faculty Note:</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #252525;">${params.noShowReason}</p>
          </div>
          <p style="font-size: 13px; color: #666;">If you believe this record was made in error, you may submit an explanation or appeal via your CUCampusSaathi Attendance History tab.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.studentEmail,
      recipientRole: 'STUDENT',
      subject,
      templateType: 'NO_SHOW_RECORDED',
      html,
      appointmentId: params.appointmentId,
    });
  }

  // 7. Teacher blocked student -> Student email
  async sendStudentBlockedEmail(params: {
    studentEmail: string;
    studentName: string;
    teacherName: string;
    reason: string;
  }) {
    const subject = `[Notification] Booking Restriction from Prof. ${params.teacherName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #C62828; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Booking Notice</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>Prof. <strong>${params.teacherName}</strong> has placed a restriction on new consultation requests from your account.</p>
          <div style="background: #FFF1F1; padding: 12px; border-left: 4px solid #C62828; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #8E1717;">Reason:</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #252525;">${params.reason}</p>
          </div>
          <p style="font-size: 13px; color: #666;">Please note that your general account remains active and you can continue booking consultations with other faculty members.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.studentEmail,
      recipientRole: 'STUDENT',
      subject,
      templateType: 'STUDENT_BLOCKED',
      html,
    });
  }

  // 8. Teacher unblocked student -> Student email
  async sendStudentUnblockedEmail(params: {
    studentEmail: string;
    studentName: string;
    teacherName: string;
    unblockReason?: string;
  }) {
    const subject = `[Access Restored] You can now book consultations with Prof. ${params.teacherName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E7DADA; border-radius: 12px; background: #FFF7F7;">
        <div style="background: #16845B; color: white; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Consultation Access Restored</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #E7DADA;">
          <p>Dear <strong>${params.studentName}</strong>,</p>
          <p>Your consultation booking access with <strong>Prof. ${params.teacherName}</strong> has been restored.</p>
          ${params.unblockReason ? `<p><strong>Note:</strong> ${params.unblockReason}</p>` : ''}
          <p style="font-size: 13px; color: #666;">You may now view and book available slots on their profile.</p>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: params.studentEmail,
      recipientRole: 'STUDENT',
      subject,
      templateType: 'STUDENT_UNBLOCKED',
      html,
    });
  }
}

export const emailService = new EmailService();
