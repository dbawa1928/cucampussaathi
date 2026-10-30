import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { TeacherProfile } from '../models/TeacherProfile';
import { StudentProfile } from '../models/StudentProfile';
import { Appointment } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { AdminAuditLog } from '../models/AdminAuditLog';
import { Notification } from '../models/Notification';
import { ACCESS_TOKEN_COOKIE, signAccessToken } from '../utils/token';
import { hashPassword } from '../utils/password';
import { sanitizeCsvCell } from '../utils/csvExport';

const app = createApp();

describe('Milestone 6: Admin Dashboard, Campus Management & Platform Analytics', () => {
  const timestamp = Date.now();

  let adminUserId: string;
  let adminCookie: string;

  let studentUserId: string;
  let studentCookie: string;

  let teacherUserId: string;
  let teacherProfileId: string;
  let teacherCookie: string;

  let testAppointmentId: string;
  let testSlotId: string;

  const adminUserData = {
    fullName: 'System Administrator Lead',
    email: `m6_admin_${timestamp}@cuchd.in`,
    uid: `M6A_${timestamp}`.slice(0, 15),
    password: 'AdminPassword123!@#',
    role: 'ADMIN' as const,
    department: 'University Administration',
    isVerified: true,
  };

  const studentUserData = {
    fullName: 'M6 Student Managed',
    email: `m6_student_${timestamp}@cuchd.in`,
    uid: `M6S_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 5,
  };

  const teacherUserData = {
    fullName: 'Dr. M6 Faculty To Verify',
    email: `m6_teacher_${timestamp}@cuchd.in`,
    uid: `M6T_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    officeLocation: 'Block 4, Cabin 102',
    maxDailySlots: 4,
  };

  beforeAll(async () => {
    await connectDatabase();

    // 1. Create Admin account directly in database
    const pwdHash = await hashPassword(adminUserData.password);
    const createdAdmin = await User.create({
      fullName: adminUserData.fullName,
      email: adminUserData.email,
      uid: adminUserData.uid,
      passwordHash: pwdHash,
      role: 'ADMIN',
      department: adminUserData.department,
      isVerified: true,
      accountStatus: 'ACTIVE',
    });
    adminUserId = createdAdmin._id.toString();

    const adminToken = signAccessToken({
      sub: adminUserId,
      email: createdAdmin.email,
      role: 'ADMIN',
      uid: createdAdmin.uid,
    });
    adminCookie = `${ACCESS_TOKEN_COOKIE}=${adminToken}`;

    // 2. Register Student through standard auth route
    const sRes = await request(app).post('/api/v1/auth/register').send(studentUserData);
    expect(sRes.status).toBe(201);
    studentUserId = sRes.body.data.user.id;
    studentCookie = (sRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith(ACCESS_TOKEN_COOKIE))!;

    // 3. Register Teacher through standard auth route
    const tRes = await request(app).post('/api/v1/auth/register').send(teacherUserData);
    expect(tRes.status).toBe(201);
    teacherUserId = tRes.body.data.user.id;
    teacherCookie = (tRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith(ACCESS_TOKEN_COOKIE))!;

    // Fetch Teacher Profile ID
    const tProf = await TeacherProfile.findOne({ user: teacherUserId });
    expect(tProf).not.toBeNull();
    teacherProfileId = tProf!._id.toString();

    // 4. Create an availability slot and an appointment for admin monitoring tests
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTomorrow = new Date(tomorrow.getTime() + 30 * 60 * 1000);

    const slot = await AvailabilitySlot.create({
      teacherProfile: teacherProfileId,
      startTime: tomorrow,
      endTime: endTomorrow,
      durationMinutes: 30,
      locationType: 'CABIN',
      locationDetails: 'Block 4, Cabin 102',
      status: 'RESERVED',
      isBooked: true,
    });
    testSlotId = slot._id.toString();

    const appt = await Appointment.create({
      student: studentUserId,
      teacherProfile: teacherProfileId,
      slot: testSlotId,
      agenda: 'Need guidance on distributed database sharding algorithms',
      status: 'ACCEPTED',
      meetingMode: 'IN_PERSON',
    });
    testAppointmentId = appt._id.toString();
  }, 30000);

  afterAll(async () => {
    // Clean up created test fixtures
    await Promise.all([
      User.deleteMany({
        email: { $in: [adminUserData.email, studentUserData.email, teacherUserData.email] },
      }),
      StudentProfile.deleteMany({ user: studentUserId }),
      TeacherProfile.deleteMany({ _id: teacherProfileId }),
      AvailabilitySlot.deleteMany({ _id: testSlotId }),
      Appointment.deleteMany({ _id: testAppointmentId }),
      AdminAuditLog.deleteMany({ adminUser: adminUserId }),
      Notification.deleteMany({
        recipient: { $in: [adminUserId, studentUserId, teacherUserId] },
      }),
    ]);
  });

  // =========================================================================
  // 1. ADMIN AUTHORIZATION & RBAC ENFORCEMENT
  // =========================================================================
  describe('Admin Authorization & RBAC', () => {
    it('rejects unauthenticated requests to /api/v1/admin/dashboard with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects STUDENT requests to /api/v1/admin/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [studentCookie]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('rejects TEACHER requests to /api/v1/admin/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [teacherCookie]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows ADMIN requests to access /api/v1/admin/dashboard with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [adminCookie]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  // =========================================================================
  // 2. ADMIN OVERVIEW DASHBOARD & PLATFORM ANALYTICS
  // =========================================================================
  describe('Overview Dashboard & Platform Analytics', () => {
    it('retrieves accurate live MongoDB platform overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.users.totalStudents).toBeGreaterThanOrEqual(1);
      expect(data.users.totalTeachers).toBeGreaterThanOrEqual(1);
      expect(data.users.activeUsers).toBeGreaterThanOrEqual(2);
      expect(data.verification).toBeDefined();
      expect(data.appointments.total).toBeGreaterThanOrEqual(1);
      expect(data.appointments.accepted).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.departments)).toBe(true);
      expect(Array.isArray(data.recentActivity)).toBe(true);
    });

    it('retrieves platform analytics trends for last 30 days', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics?timeframe=30d')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.timeframe).toBe('30d');
      expect(data.summary).toBeDefined();
      expect(data.summary.totalAppointments).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.userTimeline)).toBe(true);
      expect(Array.isArray(data.appointmentTimeline)).toBe(true);
      expect(Array.isArray(data.departmentDistribution)).toBe(true);
    });

    it('handles analytics queries across 7d, 90d, and all-time gracefully', async () => {
      for (const tf of ['7d', '90d', 'all']) {
        const res = await request(app)
          .get(`/api/v1/admin/analytics?timeframe=${tf}`)
          .set('Cookie', [adminCookie]);
        expect(res.status).toBe(200);
        expect(res.body.data.timeframe).toBe(tf);
      }
    });
  });

  // =========================================================================
  // 3. STUDENT MANAGEMENT & ACCOUNT SUSPENSION
  // =========================================================================
  describe('Student Management', () => {
    it('lists students with pagination and search filtering', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/students?search=${studentUserData.uid}`)
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
      const student = res.body.data.students[0];
      expect(student.uid).toBe(studentUserData.uid);
      expect(student.passwordHash).toBeUndefined(); // Never expose password hash!
      expect(student.profile).toBeDefined();
      expect(student.profile.course).toBe(studentUserData.course);
    });

    it('retrieves detailed student profile and appointment statistics', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/students/${studentUserId}`)
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.student.email).toBe(studentUserData.email);
      expect(res.body.data.appointmentStats).toBeDefined();
      expect(res.body.data.appointmentStats.total).toBeGreaterThanOrEqual(1);
    });

    it('suspends a student account with a recorded reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/students/${studentUserId}/status`)
        .set('Cookie', [adminCookie])
        .send({
          status: 'SUSPENDED',
          reason: 'Academic disciplinary review pending',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.accountStatus).toBe('SUSPENDED');
      expect(res.body.data.user.suspensionReason).toBe('Academic disciplinary review pending');

      // Verify notification was sent to student
      const notif = await Notification.findOne({
        recipient: studentUserId,
        type: 'ACCOUNT_SUSPENDED',
      });
      expect(notif).not.toBeNull();
      expect(notif!.message).toContain('Academic disciplinary review pending');
    });

    it('immediately blocks a suspended student from making authenticated requests (403)', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/mine')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('blocks a suspended student from logging in (403)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: studentUserData.email,
          password: studentUserData.password,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/suspended/i);
    });

    it('reactivates a suspended student account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/students/${studentUserId}/status`)
        .set('Cookie', [adminCookie])
        .send({
          status: 'ACTIVE',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.accountStatus).toBe('ACTIVE');

      // Verify student can make authenticated requests again
      const testRes = await request(app)
        .get('/api/v1/appointments/mine')
        .set('Cookie', [studentCookie]);
      expect(testRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 4. FACULTY MANAGEMENT & VERIFICATION WORKFLOW
  // =========================================================================
  describe('Faculty Management & Verification Workflow', () => {
    it('lists teachers with verification status filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/teachers?verificationStatus=PENDING')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.teachers)).toBe(true);
      const found = res.body.data.teachers.find((t: any) => t._id === teacherUserId);
      expect(found).toBeDefined();
      expect(found.passwordHash).toBeUndefined();
    });

    it('lists verification requests at /api/v1/admin/verifications', async () => {
      const res = await request(app)
        .get('/api/v1/admin/verifications?status=PENDING')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.verifications.length).toBeGreaterThanOrEqual(1);
      const item = res.body.data.verifications.find(
        (v: any) => v._id === teacherProfileId
      );
      expect(item).toBeDefined();
      expect(item.user.fullName).toBe(teacherUserData.fullName);
    });

    it('approves faculty verification and marks profile as VERIFIED', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verifications/${teacherProfileId}`)
        .set('Cookie', [adminCookie])
        .send({
          decision: 'APPROVE',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.verificationStatus).toBe('VERIFIED');

      // Verify User.isVerified was updated in sync
      const teacher = await User.findById(teacherUserId);
      expect(teacher!.isVerified).toBe(true);

      // Verify Notification was generated
      const notif = await Notification.findOne({
        recipient: teacherUserId,
        type: 'FACULTY_VERIFIED',
      });
      expect(notif).not.toBeNull();
      expect(notif!.title).toBe('Faculty Verification Approved');
    });

    it('rejects faculty verification with a reason', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verifications/${teacherProfileId}`)
        .set('Cookie', [adminCookie])
        .send({
          decision: 'REJECT',
          reason: 'Academic department appointment letter missing university seal',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.verificationStatus).toBe('REJECTED');
      expect(res.body.data.profile.rejectionReason).toBe(
        'Academic department appointment letter missing university seal'
      );

      // Verify User.isVerified was updated in sync
      const teacher = await User.findById(teacherUserId);
      expect(teacher!.isVerified).toBe(false);

      // Verify Notification was generated
      const notif = await Notification.findOne({
        recipient: teacherUserId,
        type: 'FACULTY_REJECTED',
      });
      expect(notif).not.toBeNull();
      expect(notif!.message).toContain('missing university seal');
    });

    it('suspends and reactivates a faculty member account', async () => {
      // Suspend
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/teachers/${teacherUserId}/status`)
        .set('Cookie', [adminCookie])
        .send({
          status: 'SUSPENDED',
          reason: 'Sabbatical leave policy compliance',
        });
      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.user.accountStatus).toBe('SUSPENDED');

      // Reactivate
      const reactivateRes = await request(app)
        .patch(`/api/v1/admin/teachers/${teacherUserId}/status`)
        .set('Cookie', [adminCookie])
        .send({
          status: 'ACTIVE',
        });
      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.user.accountStatus).toBe('ACTIVE');
    });
  });

  // =========================================================================
  // 5. APPOINTMENT MONITORING & ADMINISTRATIVE CANCELLATION
  // =========================================================================
  describe('Campus Appointment Monitoring', () => {
    it('lists appointments across campus with status and mode filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/appointments?status=ACCEPTED')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments.length).toBeGreaterThanOrEqual(1);
      const appt = res.body.data.appointments.find((a: any) => a._id === testAppointmentId);
      expect(appt).toBeDefined();
      expect(appt.student.fullName).toBe(studentUserData.fullName);
    });

    it('retrieves detailed appointment information and rescheduling history', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/appointments/${testAppointmentId}`)
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.agenda).toContain('sharding algorithms');
      expect(Array.isArray(res.body.data.proposals)).toBe(true);
    });

    it('allows administrator to cancel an appointment and release the slot', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/appointments/${testAppointmentId}/cancel`)
        .set('Cookie', [adminCookie])
        .send({
          reason: 'Academic Block 4 maintenance during scheduled window',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.appointment.status).toBe('CANCELLED');

      // Verify slot was released back to AVAILABLE
      const slot = await AvailabilitySlot.findById(testSlotId);
      expect(slot!.isBooked).toBe(false);
      expect(slot!.status).toBe('AVAILABLE');

      // Verify cancellation notifications were generated for both participants
      const studentNotif = await Notification.findOne({
        recipient: studentUserId,
        type: 'APPOINTMENT_ADMIN_CANCELLED',
      });
      expect(studentNotif).not.toBeNull();

      const teacherNotif = await Notification.findOne({
        recipient: teacherUserId,
        type: 'APPOINTMENT_ADMIN_CANCELLED',
      });
      expect(teacherNotif).not.toBeNull();
    });

    it('rejects administrative cancellation of already cancelled appointment (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/appointments/${testAppointmentId}/cancel`)
        .set('Cookie', [adminCookie])
        .send({
          reason: 'Duplicate cancellation attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already cancelled/i);
    });
  });

  // =========================================================================
  // 6. REPORTS AND CSV EXPORT SECURITY
  // =========================================================================
  describe('Reports and CSV Export Security', () => {
    it('exports student CSV report with safe headers and excluded secrets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports?type=students')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Full Name');
      expect(res.text).toContain('University UID');
      expect(res.text).not.toContain('passwordHash');
      expect(res.text).not.toContain('argon2');
    });

    it('exports platform summary CSV report', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports?type=platform-summary')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Total Students');
      expect(res.text).toContain('Total Appointments');
    });

    it('mitigates CSV formula injection attacks by sanitizing dangerous prefixes', () => {
      const formulaInjectionPayloads = [
        '=cmd|\' /C calc\'!A0',
        '+1+1',
        '-5+2',
        '@SUM(A1:A10)',
        '\tTAB_INDENT',
        '\rCARRIAGE_RETURN',
      ];

      for (const payload of formulaInjectionPayloads) {
        const sanitized = sanitizeCsvCell(payload);
        // Must start with quote followed by single quote "'"
        expect(sanitized.startsWith('"\'')).toBe(true);
      }
    });
  });

  // =========================================================================
  // 7. ADMIN ACTIVITY AUDIT LOGS
  // =========================================================================
  describe('Admin Activity Audit Trail', () => {
    it('retrieves persistent audit log records generated during administrative actions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const logs = res.body.data.logs;
      expect(logs.length).toBeGreaterThanOrEqual(1);

      // Verify that student suspension, faculty verification, and report exports were logged
      const actions = logs.map((l: any) => l.action);
      expect(actions).toContain('STUDENT_SUSPENDED');
      expect(actions).toContain('FACULTY_APPROVED');
      expect(actions).toContain('REPORT_EXPORTED');
    });

    it('blocks ordinary non-admin users from retrieving audit logs (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Cookie', [studentCookie]);
      expect(res.status).toBe(403);
    });
  });
});
