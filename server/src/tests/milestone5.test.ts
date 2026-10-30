import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { AddressInfo } from 'net';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app';
import { connectDatabase } from '../config/database';
import { initSocketServer, closeSocketServer } from '../socket';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { RescheduleProposal } from '../models/RescheduleProposal';
import { Appointment } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { ACCESS_TOKEN_COOKIE, signAccessToken } from '../utils/token';
import { reminderService } from '../services/reminderService';
import { notificationService } from '../services/notificationService';

const app = createApp();

describe('Milestone 5: Notifications, Meeting Links & Rescheduling Engine', () => {
  const timestamp = Date.now();

  const studentUser = {
    fullName: 'M5 Student Tester',
    email: `m5_student_${timestamp}@cuchd.in`,
    uid: `M5S_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 6,
  };

  const unrelatedStudentUser = {
    fullName: 'Unrelated Student',
    email: `m5_unrelated_${timestamp}@cuchd.in`,
    uid: `M5U_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Information Technology',
    course: 'B.Tech IT',
    semester: 4,
  };

  const teacherUser = {
    fullName: 'Dr. M5 Faculty Mentor',
    email: `m5_teacher_${timestamp}@cuchd.in`,
    uid: `M5T_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Computer Science & Engineering',
    designation: 'Professor',
    officeLocation: 'Academic Block 2, Cabin 204',
    maxDailySlots: 6,
  };

  let studentCookie: string;
  let unrelatedStudentCookie: string;
  let teacherCookie: string;

  let studentUserId: string;
  let teacherUserId: string;
  let teacherProfileId: string;

  let slot1Id: string;
  let slot2Id: string;
  let appointmentId: string;

  let httpServer: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    await connectDatabase();

    // Start ephemeral HTTP & Socket server for socket tests
    httpServer = http.createServer(app);
    initSocketServer(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });

    // 1. Register student
    const sRes = await request(app).post('/api/v1/auth/register').send(studentUser);
    expect(sRes.status).toBe(201);
    studentUserId = sRes.body.data.user.id;
    studentCookie = (sRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith(ACCESS_TOKEN_COOKIE))!;

    // 2. Register unrelated student
    const uRes = await request(app).post('/api/v1/auth/register').send(unrelatedStudentUser);
    expect(uRes.status).toBe(201);
    unrelatedStudentCookie = (uRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith(ACCESS_TOKEN_COOKIE))!;

    // 3. Register teacher
    const tRes = await request(app).post('/api/v1/auth/register').send(teacherUser);
    expect(tRes.status).toBe(201);
    teacherUserId = tRes.body.data.user.id;
    teacherCookie = (tRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith(ACCESS_TOKEN_COOKIE))!;

    // Fetch teacher profile id
    const tProfileRes = await request(app)
      .get('/api/v1/users/profile/teacher')
      .set('Cookie', [teacherCookie]);
    teacherProfileId = tProfileRes.body.data.profile._id;

    // 4. Create two future availability slots for teacher
    const tomorrow10am = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow10am.setHours(10, 0, 0, 0);
    const tomorrow1030am = new Date(tomorrow10am.getTime() + 30 * 60 * 1000);

    const slot1Res = await request(app)
      .post('/api/v1/availability')
      .set('Cookie', [teacherCookie])
      .send({
        startTime: tomorrow10am.toISOString(),
        endTime: tomorrow1030am.toISOString(),
        locationType: 'CABIN',
      });
    expect(slot1Res.status).toBe(201);
    slot1Id = slot1Res.body.data.slot._id;

    const dayAfter11am = new Date(Date.now() + 48 * 60 * 60 * 1000);
    dayAfter11am.setHours(11, 0, 0, 0);
    const dayAfter1130am = new Date(dayAfter11am.getTime() + 30 * 60 * 1000);

    const slot2Res = await request(app)
      .post('/api/v1/availability')
      .set('Cookie', [teacherCookie])
      .send({
        startTime: dayAfter11am.toISOString(),
        endTime: dayAfter1130am.toISOString(),
        locationType: 'VIRTUAL_MEET',
      });
    expect(slot2Res.status).toBe(201);
    slot2Id = slot2Res.body.data.slot._id;

    // 5. Student books slot 1
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Cookie', [studentCookie])
      .send({
        slotId: slot1Id,
        agenda: 'Discussion on cloud microservices architecture and capstone guidance.',
      });
    expect(bookRes.status).toBe(201);
    appointmentId = bookRes.body.data.appointment._id;
  });

  afterAll(async () => {
    try {
      await closeSocketServer();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await User.deleteMany({ email: { $regex: /_m5_/ } });
      await AvailabilitySlot.deleteMany({ _id: { $in: [slot1Id, slot2Id] } });
      await Appointment.deleteMany({ _id: appointmentId });
      await RescheduleProposal.deleteMany({ appointment: appointmentId });
      await Notification.deleteMany({
        recipient: { $in: [studentUserId, teacherUserId] },
      });
    } catch {}
  });

  // --------------------------------------------------------------------------
  // 1. Notification REST API & Lifecycle
  // --------------------------------------------------------------------------
  describe('Notification REST API & Data Model', () => {
    let testNotificationId: string;

    it('rejects unauthenticated requests to notifications with 401', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('verifies notification was automatically generated for teacher on appointment booking', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);

      const bookingNotif = res.body.data.notifications.find(
        (n: any) => n.type === 'APPOINTMENT_BOOKED'
      );
      expect(bookingNotif).toBeDefined();
      expect(bookingNotif.title).toContain('Consultation Request');
      expect(bookingNotif.isRead).toBe(false);
      testNotificationId = bookingNotif._id;
    });

    it('retrieves accurate unread notification count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });

    it('prevents cross-user notification marking or modification with 403', async () => {
      // Student attempts to mark Teacher's notification as read
      const res = await request(app)
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(403);
    });

    it('marks a notification as read and records readAt timestamp', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.isRead).toBe(true);
      expect(res.body.data.notification.readAt).toBeDefined();
    });

    it('marks all notifications as read for the user', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Cookie', [teacherCookie]);
      expect(countRes.body.data.count).toBe(0);
    });

    it('deletes a notification belonging to the authenticated user', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${testNotificationId}`)
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);

      const verifyDeleted = await Notification.findById(testNotificationId);
      expect(verifyDeleted).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Real-Time Socket.IO Connections & Event Routing
  // --------------------------------------------------------------------------
  describe('Socket.IO Real-Time Engine & Security', () => {
    it('rejects unauthorized socket connection without token', async () => {
      const socket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 3000,
      });

      const error = await new Promise<string>((resolve) => {
        socket.on('connect_error', (err) => {
          resolve(err.message);
          socket.disconnect();
        });
      });

      expect(error).toContain('Authentication token required');
    });

    it('accepts authenticated socket connection with valid JWT in auth object', async () => {
      const studentToken = signAccessToken({
        sub: studentUserId,
        email: studentUser.email,
        role: 'STUDENT',
        uid: studentUser.uid,
      });

      const socket: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: studentToken },
      });

      const isConnected = await new Promise<boolean>((resolve) => {
        socket.on('connect', () => {
          resolve(true);
        });
        socket.on('connect_error', () => {
          resolve(false);
        });
      });

      expect(isConnected).toBe(true);
      socket.disconnect();
    });

    it('delivers real-time notification to the target user private room', async () => {
      const studentToken = signAccessToken({
        sub: studentUserId,
        email: studentUser.email,
        role: 'STUDENT',
        uid: studentUser.uid,
      });

      const socket: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: studentToken },
      });

      await new Promise<void>((resolve) => socket.on('connect', () => resolve()));

      // Set up notification listener on client
      const notificationPromise = new Promise<any>((resolve) => {
        socket.on('notification:new', (data) => {
          resolve(data);
        });
      });

      // Backend generates notification
      await notificationService.createNotification({
        recipient: studentUserId,
        type: 'APPOINTMENT_ACCEPTED',
        title: 'Realtime Test Notification',
        message: 'This is a test socket event message.',
      });

      const received = await notificationPromise;
      expect(received).toBeDefined();
      expect(received.title).toBe('Realtime Test Notification');
      expect(received.recipient).toBe(studentUserId);

      socket.disconnect();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Consultation Meeting Links & Modes
  // --------------------------------------------------------------------------
  describe('Consultation Meeting Links & Modes', () => {
    it('allows assigned teacher to set meetingMode to ONLINE with a valid HTTPS Google Meet URL', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentId}/meeting-details`)
        .set('Cookie', [teacherCookie])
        .send({
          meetingMode: 'ONLINE',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          meetingInstructions: 'Please join 5 minutes early with your code repository open.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.meetingMode).toBe('ONLINE');
      expect(res.body.data.appointment.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
      expect(res.body.data.appointment.meetingInstructions).toContain('join 5 minutes early');
    });

    it('rejects invalid or non-HTTPS meeting URL with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentId}/meeting-details`)
        .set('Cookie', [teacherCookie])
        .send({
          meetingMode: 'ONLINE',
          meetingLink: 'http://insecure-meet.com/room', // Insecure HTTP protocol
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('blocks student or unrelated user from updating meeting details with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentId}/meeting-details`)
        .set('Cookie', [studentCookie])
        .send({
          meetingMode: 'IN_PERSON',
        });

      expect(res.status).toBe(403);
    });

    it('allows student to view meeting details on their appointment', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`)
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
      expect(res.body.data.appointment.meetingMode).toBe('ONLINE');
    });

    it('blocks unrelated user from viewing appointment details with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`)
        .set('Cookie', [unrelatedStudentCookie]);

      expect(res.status).toBe(403);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Appointment Rescheduling Workflow & Slot Handover
  // --------------------------------------------------------------------------
  describe('Safe Appointment Rescheduling Engine', () => {
    let proposalId: string;

    it('teacher accepts appointment to move status from PENDING to ACCEPTED', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/accept`)
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('ACCEPTED');
    });

    it('allows student to propose rescheduling to an available future slot (slot 2)', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule-proposals`)
        .set('Cookie', [studentCookie])
        .send({
          proposedSlotId: slot2Id,
          reason: 'Need extra preparation time for prototype demonstration.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proposal.status).toBe('PENDING');
      expect(res.body.data.proposal.proposedSlot).toBe(slot2Id);
      proposalId = res.body.data.proposal._id;
    });

    it('rejects a second conflicting proposal while one is already pending with 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule-proposals`)
        .set('Cookie', [studentCookie])
        .send({
          proposedSlotId: slot2Id,
          reason: 'Duplicate proposal attempt',
        });

      expect(res.status).toBe(409);
    });

    it('proposer cannot accept their own reschedule proposal with 400 Bad Request', async () => {
      // Student proposed it, so student cannot accept it
      const res = await request(app)
        .post(`/api/v1/reschedule-proposals/${proposalId}/accept`)
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(400);
    });

    it('unrelated user cannot respond to the proposal with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/reschedule-proposals/${proposalId}/accept`)
        .set('Cookie', [unrelatedStudentCookie]);

      expect(res.status).toBe(403);
    });

    it('assigned teacher accepts the proposal: appointment slot updates and old slot is released', async () => {
      const res = await request(app)
        .post(`/api/v1/reschedule-proposals/${proposalId}/accept`)
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proposal.status).toBe('ACCEPTED');
      expect(res.body.data.appointment.slot).toBe(slot2Id);

      // Verify slot 2 is now booked (RESERVED)
      const newSlot = await AvailabilitySlot.findById(slot2Id);
      expect(newSlot?.isBooked).toBe(true);
      expect(newSlot?.status).toBe('RESERVED');

      // Verify original slot 1 was safely released back to AVAILABLE!
      const oldSlot = await AvailabilitySlot.findById(slot1Id);
      expect(oldSlot?.isBooked).toBe(false);
      expect(oldSlot?.status).toBe('AVAILABLE');
    });

    it('verifies proposer received notification about accepted reschedule', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      const rescheduleNotif = res.body.data.notifications.find(
        (n: any) => n.type === 'APPOINTMENT_RESCHEDULE_ACCEPTED'
      );
      expect(rescheduleNotif).toBeDefined();
    });

    it('tests proposal withdrawal workflow with a second proposal', async () => {
      // Teacher proposes moving back to slot 1 (which was released)
      const p2Res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule-proposals`)
        .set('Cookie', [teacherCookie])
        .send({
          proposedSlotId: slot1Id,
          reason: 'Can we move to slot 1 again?',
        });
      expect(p2Res.status).toBe(201);
      const p2Id = p2Res.body.data.proposal._id;

      // Teacher withdraws own proposal
      const withdrawRes = await request(app)
        .post(`/api/v1/reschedule-proposals/${p2Id}/withdraw`)
        .set('Cookie', [teacherCookie]);

      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.data.proposal.status).toBe('WITHDRAWN');
    });

    it('tests proposal rejection workflow: rejection leaves original appointment intact', async () => {
      // Student proposes slot 1
      const p3Res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule-proposals`)
        .set('Cookie', [studentCookie])
        .send({
          proposedSlotId: slot1Id,
          reason: 'Let us try slot 1',
        });
      expect(p3Res.status).toBe(201);
      const p3Id = p3Res.body.data.proposal._id;

      // Teacher rejects proposal
      const rejectRes = await request(app)
        .post(`/api/v1/reschedule-proposals/${p3Id}/reject`)
        .set('Cookie', [teacherCookie])
        .send({
          reason: 'Faculty has scheduled department meeting at that time.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.proposal.status).toBe('REJECTED');

      // Original appointment remains tied to slot 2
      const appt = await Appointment.findById(appointmentId);
      expect(appt?.slot.toString()).toBe(slot2Id);
    });

    it('prevents rescheduling of COMPLETED appointments with 400 Bad Request', async () => {
      // Mark appointment completed
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'COMPLETED' });

      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule-proposals`)
        .set('Cookie', [studentCookie])
        .send({
          proposedSlotId: slot1Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('COMPLETED');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Automated Upcoming Consultation Reminders
  // --------------------------------------------------------------------------
  describe('Upcoming Consultation Reminders Engine', () => {
    it('processes upcoming consultation reminders with idempotency', async () => {
      // Reset appointment to ACCEPTED with a slot starting within the next 24 hours
      const nearFutureSlot = await AvailabilitySlot.create({
        teacherProfile: teacherProfileId,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
        durationMinutes: 30,
        locationType: 'CABIN',
        isBooked: true,
        status: 'RESERVED',
      });

      const reminderAppt = await Appointment.create({
        student: studentUserId,
        teacherProfile: teacherProfileId,
        slot: nearFutureSlot._id,
        agenda: 'Reminder system verification appointment.',
        status: 'ACCEPTED',
      });

      // Pass 1: Reminder should be triggered for both participants
      const remindersSentPass1 = await reminderService.processUpcomingReminders(24);
      expect(remindersSentPass1).toBeGreaterThanOrEqual(1);

      // Verify reminderSentAt was recorded
      const updatedAppt = await Appointment.findById(reminderAppt._id);
      expect(updatedAppt?.reminderSentAt).toBeDefined();

      // Pass 2: Idempotent - should NOT generate duplicate reminders
      const remindersSentPass2 = await reminderService.processUpcomingReminders(24);
      expect(remindersSentPass2).toBe(0);

      // Verify student received the reminder notification in database
      const notifs = await Notification.find({
        recipient: studentUserId,
        type: 'CONSULTATION_REMINDER',
        relatedAppointment: reminderAppt._id,
      });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toBe('Upcoming Faculty Consultation');

      // Cleanup
      await Appointment.deleteOne({ _id: reminderAppt._id });
      await AvailabilitySlot.deleteOne({ _id: nearFutureSlot._id });
    });
  });
});
