import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { TeacherProfile } from '../models/TeacherProfile';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Appointment } from '../models/Appointment';
import { RefreshToken } from '../models/RefreshToken';
import { ACCESS_TOKEN_COOKIE } from '../utils/token';

const app = createApp();

describe('FacultyConnect Availability & Appointment Booking Engine', () => {
  const timestamp = Date.now();

  const studentUser1 = {
    fullName: 'Rahul Verma (Student 1)',
    email: `rahul_booking_${timestamp}@cuchd.in`,
    uid: `STU1_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 6,
  };

  const studentUser2 = {
    fullName: 'Ananya Roy (Student 2)',
    email: `ananya_booking_${timestamp}@cuchd.in`,
    uid: `STU2_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 4,
  };

  const teacherUser1 = {
    fullName: 'Dr. Amit Sengupta (Teacher 1)',
    email: `amit_booking_${timestamp}@cuchd.in`,
    uid: `TEA1_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    officeLocation: 'Academic Block 3, Cabin 305',
    maxDailySlots: 4,
  };

  const teacherUser2 = {
    fullName: 'Dr. Neha Sharma (Teacher 2)',
    email: `neha_booking_${timestamp}@cuchd.in`,
    uid: `TEA2_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Artificial Intelligence',
    designation: 'Assistant Professor',
    officeLocation: 'Academic Block 1, Cabin 102',
    maxDailySlots: 2,
  };

  let student1Cookie: string;
  let student2Cookie: string;
  let teacher1Cookie: string;
  let teacher2Cookie: string;

  let teacher1ProfileId: string;
  let slot1Id: string;
  let slot2Id: string;
  let slotForConcurrentId: string;

  beforeAll(async () => {
    try {
      await connectDatabase();
    } catch (err: any) {
      console.warn('Database connection unavailable for booking tests:', err.message);
      return;
    }

    // Register Student 1
    const s1Res = await request(app).post('/api/v1/auth/register').send(studentUser1);
    student1Cookie = (s1Res.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';

    // Register Student 2
    const s2Res = await request(app).post('/api/v1/auth/register').send(studentUser2);
    student2Cookie = (s2Res.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';

    // Register Teacher 1
    const t1Res = await request(app).post('/api/v1/auth/register').send(teacherUser1);
    teacher1Cookie = (t1Res.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';

    // Register Teacher 2
    const t2Res = await request(app).post('/api/v1/auth/register').send(teacherUser2);
    teacher2Cookie = (t2Res.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';

    // Fetch Teacher 1 profile ID
    const t1ProfileRes = await request(app)
      .get('/api/v1/users/profile/teacher')
      .set('Cookie', [teacher1Cookie]);
    teacher1ProfileId = t1ProfileRes.body.data.profile._id;
  });

  afterAll(async () => {
    try {
      await User.deleteMany({ email: { $regex: /_booking_/ } });
      await TeacherProfile.deleteMany({ officeLocation: { $in: ['Academic Block 3, Cabin 305', 'Academic Block 1, Cabin 102'] } });
      await AvailabilitySlot.deleteMany({ locationDetails: { $regex: /Cabin 305|Cabin 102/ } });
      await Appointment.deleteMany({ agenda: { $regex: /Capstone|Consultation|Thesis/ } });
      await RefreshToken.deleteMany({});
      await disconnectDatabase();
    } catch {
      // Ignore if disconnected
    }
  });

  // 1. Teacher Availability Management
  describe('Teacher Availability Management (/api/v1/availability)', () => {
    it('creates a valid future availability slot for authenticated teacher', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const start = new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString();
      const end = new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString();

      const res = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
          locationType: 'CABIN',
          locationDetails: 'Academic Block 3, Cabin 305',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slot.isBooked).toBe(false);
      expect(res.body.data.slot.status).toBe('AVAILABLE');
      slot1Id = res.body.data.slot._id;
    });

    it('creates a second distinct slot and a slot for concurrency testing', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const start2 = new Date(tomorrow.setHours(11, 0, 0, 0)).toISOString();
      const end2 = new Date(tomorrow.setHours(11, 30, 0, 0)).toISOString();

      const res2 = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start2,
          endTime: end2,
          locationType: 'VIRTUAL_MEET',
          locationDetails: 'Google Meet link provided on acceptance',
        });

      expect(res2.status).toBe(201);
      slot2Id = res2.body.data.slot._id;

      // Update slot2
      const updateRes = await request(app)
        .put(`/api/v1/availability/${slot2Id}`)
        .set('Cookie', [teacher1Cookie])
        .send({
          locationDetails: 'Updated Google Meet consultation link',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.slot.locationDetails).toBe('Updated Google Meet consultation link');

      // Slot for concurrency test
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const startConc = new Date(dayAfter.setHours(14, 0, 0, 0)).toISOString();
      const endConc = new Date(dayAfter.setHours(14, 30, 0, 0)).toISOString();

      const resConc = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: startConc,
          endTime: endConc,
          locationType: 'CABIN',
          locationDetails: 'Academic Block 3, Cabin 305',
        });

      expect(resConc.status).toBe(201);
      slotForConcurrentId = resConc.body.data.slot._id;
    });

    it('rejects slot creation with invalid past timestamp', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const start = new Date(yesterday.setHours(10, 0, 0, 0)).toISOString();
      const end = new Date(yesterday.setHours(10, 30, 0, 0)).toISOString();

      const res = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
          locationType: 'CABIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects slot where endTime is earlier than or equal to startTime', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const start = new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString();
      const end = new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(); // invalid

      const res = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('prevents overlapping availability slots for the same teacher with 409 Conflict', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Overlaps with 10:00 - 10:30 slot
      const start = new Date(tomorrow.setHours(10, 15, 0, 0)).toISOString();
      const end = new Date(tomorrow.setHours(10, 45, 0, 0)).toISOString();

      const res = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
          locationType: 'CABIN',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('allows teacher to retrieve their own slots via /availability/mine', async () => {
      const res = await request(app)
        .get('/api/v1/availability/mine')
        .set('Cookie', [teacher1Cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.slots.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('allows students to query a teacher public available slots', async () => {
      const res = await request(app)
        .get(`/api/v1/availability/teacher/${teacher1ProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slots.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.slots.every((s: any) => s.isBooked === false)).toBe(true);
    });

    it('blocks student from creating availability slots with 403 Forbidden', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [student1Cookie])
        .send({
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 30 * 60000).toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it('prevents a teacher from modifying or deleting another teacher slots', async () => {
      const res = await request(app)
        .delete(`/api/v1/availability/${slot1Id}`)
        .set('Cookie', [teacher2Cookie]); // Teacher 2 attempting to delete Teacher 1's slot

      expect(res.status).toBe(403);
    });
  });

  // 2. Student Appointment Booking & Concurrency
  describe('Student Appointment Booking (/api/v1/appointments)', () => {
    let appointment1Id: string;

    it('rejects booking request with missing or too short agenda (< 10 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student1Cookie])
        .send({
          slotId: slot1Id,
          agenda: 'Hi', // Too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('successfully books an available slot with valid agenda', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student1Cookie])
        .send({
          slotId: slot1Id,
          agenda: 'Review Capstone Project Phase 1 system architecture and cloud database schema.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.status).toBe('PENDING');
      expect(res.body.data.appointment.slot).toBe(slot1Id);
      appointment1Id = res.body.data.appointment._id;

      // Slot must now be marked as isBooked: true, status: 'RESERVED'
      const slotDoc = await AvailabilitySlot.findById(slot1Id);
      expect(slotDoc?.isBooked).toBe(true);
      expect(slotDoc?.status).toBe('RESERVED');
    });

    it('returns 409 Conflict when attempting to book an already-booked slot', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student2Cookie])
        .send({
          slotId: slot1Id, // Already booked by Student 1
          agenda: 'Seeking guidance on computer vision research and dataset labeling.',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('handles simultaneous booking attempts against one slot: exactly ONE succeeds, other gets 409', async () => {
      // Both students attempt to book slotForConcurrentId at the exact same moment
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/appointments')
          .set('Cookie', [student1Cookie])
          .send({
            slotId: slotForConcurrentId,
            agenda: 'Student 1 concurrent thesis discussion request.',
          }),
        request(app)
          .post('/api/v1/appointments')
          .set('Cookie', [student2Cookie])
          .send({
            slotId: slotForConcurrentId,
            agenda: 'Student 2 concurrent thesis discussion request.',
          }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one request must receive 201 Created and the other must receive 409 Conflict
      expect(statuses).toEqual([201, 409]);
    });

    it('prevents modifying or deleting a slot that has an active appointment', async () => {
      const res = await request(app)
        .delete(`/api/v1/availability/${slot1Id}`)
        .set('Cookie', [teacher1Cookie]);

      expect(res.status).toBe(409);
    });

    it('lists appointments for the booking student via /appointments/mine', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/mine')
        .set('Cookie', [student1Cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.appointments[0].student._id).toBeDefined();
      expect(res.body.data.appointments[0].slot).toBeDefined();
    });

    it('lists received appointments for the assigned teacher via /appointments/mine', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/mine')
        .set('Cookie', [teacher1Cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments.length).toBeGreaterThanOrEqual(1);
    });

    it('restricts /appointments/:id access to authorized parties (student, teacher, admin)', async () => {
      // Student 2 was not involved in appointment1
      const res = await request(app)
        .get(`/api/v1/appointments/${appointment1Id}`)
        .set('Cookie', [student2Cookie]);

      expect(res.status).toBe(403);
    });
  });

  // 3. Appointment Lifecycle & State Machine Transitions
  describe('Appointment Lifecycle & State Machine Transitions', () => {
    let lifecycleSlotId: string;
    let lifecycleAppointmentId: string;

    beforeAll(async () => {
      const futureDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const start = new Date(futureDate.setHours(9, 0, 0, 0)).toISOString();
      const end = new Date(futureDate.setHours(9, 30, 0, 0)).toISOString();

      const slotRes = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
          locationType: 'CABIN',
          locationDetails: 'Academic Block 3, Cabin 305',
        });
      lifecycleSlotId = slotRes.body.data.slot._id;

      const apptRes = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student1Cookie])
        .send({
          slotId: lifecycleSlotId,
          agenda: 'Review Capstone Project Phase 2 algorithm implementation.',
        });
      lifecycleAppointmentId = apptRes.body.data.appointment._id;
    });

    it('allows teacher to accept a PENDING appointment', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${lifecycleAppointmentId}/accept`)
        .set('Cookie', [teacher1Cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('ACCEPTED');
    });

    it('rejects invalid transition: cannot reject an already ACCEPTED appointment', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${lifecycleAppointmentId}/reject`)
        .set('Cookie', [teacher1Cookie])
        .send({ rejectionReason: 'No longer available' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('allows teacher to mark an ACCEPTED appointment as COMPLETED with notes', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${lifecycleAppointmentId}/complete`)
        .set('Cookie', [teacher1Cookie])
        .send({ teacherNotes: 'Discussion completed. Approved to proceed with testing.' });

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('COMPLETED');
      expect(res.body.data.appointment.teacherNotes).toContain('Approved to proceed');
    });

    it('rejects cancellation of a COMPLETED appointment', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${lifecycleAppointmentId}/cancel`)
        .set('Cookie', [student1Cookie]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('verifies slot release: rejecting or cancelling releases the slot back to AVAILABLE', async () => {
      // 1. Create fresh slot
      const futureDate = new Date(Date.now() + 96 * 60 * 60 * 1000);
      const start = new Date(futureDate.setHours(16, 0, 0, 0)).toISOString();
      const end = new Date(futureDate.setHours(16, 30, 0, 0)).toISOString();

      const slotRes = await request(app)
        .post('/api/v1/availability')
        .set('Cookie', [teacher1Cookie])
        .send({
          startTime: start,
          endTime: end,
          locationType: 'CABIN',
        });
      const testSlotId = slotRes.body.data.slot._id;

      // 2. Student books it
      const apptRes = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student1Cookie])
        .send({
          slotId: testSlotId,
          agenda: 'Review Capstone Project Phase 3 deployment pipelines.',
        });
      const testApptId = apptRes.body.data.appointment._id;

      // 3. Student cancels it
      const cancelRes = await request(app)
        .post(`/api/v1/appointments/${testApptId}/cancel`)
        .set('Cookie', [student1Cookie])
        .send({ reason: 'Schedule conflict with exam' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.appointment.status).toBe('CANCELLED');

      // 4. Verify the slot is atomically released and can be booked again by Student 2
      const slotAfterCancel = await AvailabilitySlot.findById(testSlotId);
      expect(slotAfterCancel?.isBooked).toBe(false);
      expect(slotAfterCancel?.status).toBe('AVAILABLE');

      const rebookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', [student2Cookie])
        .send({
          slotId: testSlotId,
          agenda: 'Student 2 re-booking the newly released consultation slot.',
        });

      expect(rebookRes.status).toBe(201);
      expect(rebookRes.body.data.appointment.status).toBe('PENDING');
    });
  });
});
