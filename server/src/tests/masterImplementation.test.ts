import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Appointment } from '../models/Appointment';
import { TeacherStudentRestriction } from '../models/TeacherStudentRestriction';
import { EmailLog } from '../models/EmailLog';
import { ACCESS_TOKEN_COOKIE, signAccessToken } from '../utils/token';
import { hashPassword } from '../utils/password';
import { emailService } from '../services/emailService';

const app = createApp();

describe('Master Implementation: Student-Faculty Consultations, Restrictions, Attendance & Redesign', () => {
  const ts = Date.now();

  let studentId: string;
  let studentCookie: string;

  let student2Id: string;

  let teacher1UserId: string;
  let teacher1ProfileId: string;
  let teacher1Cookie: string;

  let teacher2UserId: string;
  let teacher2ProfileId: string;

  let adminUserId: string;
  let adminCookie: string;

  let slot1Id: string;
  let slot2Id: string;
  let slot3Id: string;

  beforeAll(async () => {
    await connectDatabase();
    const passwordHash = await hashPassword('CuSecret@123');

    // Create all 5 users in parallel
    const [studentUser, student2User, teacher1User, teacher2User, adminUser] = await Promise.all([
      User.create({
        fullName: `Test Student ${ts}`,
        email: `student_${ts}@cuchd.in`,
        passwordHash,
        role: 'STUDENT',
        department: 'Computer Science and Engineering',
        uid: `STU${ts.toString().slice(-6)}`,
        isVerified: true,
        accountStatus: 'ACTIVE',
      }),
      User.create({
        fullName: `Second Student ${ts}`,
        email: `student2_${ts}@cuchd.in`,
        passwordHash,
        role: 'STUDENT',
        department: 'Computer Science and Engineering',
        uid: `STU2${ts.toString().slice(-5)}`,
        isVerified: true,
        accountStatus: 'ACTIVE',
      }),
      User.create({
        fullName: `Dr. Teacher One ${ts}`,
        email: `teacher1_${ts}@cumail.in`,
        passwordHash,
        role: 'TEACHER',
        department: 'Computer Science and Engineering',
        uid: `TCH1${ts.toString().slice(-5)}`,
        isVerified: true,
        accountStatus: 'ACTIVE',
      }),
      User.create({
        fullName: `Prof. Teacher Two ${ts}`,
        email: `teacher2_${ts}@cumail.in`,
        passwordHash,
        role: 'TEACHER',
        department: 'Computer Science and Engineering',
        uid: `TCH2${ts.toString().slice(-5)}`,
        isVerified: true,
        accountStatus: 'ACTIVE',
      }),
      User.create({
        fullName: `Platform Admin ${ts}`,
        email: `admin_${ts}@cumail.in`,
        passwordHash,
        role: 'ADMIN',
        department: 'Administrative Services',
        uid: `ADM${ts.toString().slice(-5)}`,
        isVerified: true,
        accountStatus: 'ACTIVE',
      }),
    ]);

    studentId = studentUser._id.toString();
    student2Id = student2User._id.toString();
    teacher1UserId = teacher1User._id.toString();
    teacher2UserId = teacher2User._id.toString();
    adminUserId = adminUser._id.toString();

    studentCookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: studentId,
      uid: studentUser.uid,
      email: studentUser.email,
      role: 'STUDENT',
    })}`;

    teacher1Cookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: teacher1UserId,
      uid: teacher1User.uid,
      email: teacher1User.email,
      role: 'TEACHER',
    })}`;

    adminCookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: adminUserId,
      uid: adminUser.uid,
      email: adminUser.email,
      role: 'ADMIN',
    })}`;

    // Create Profiles in parallel
    const [, , tProf1, tProf2] = await Promise.all([
      StudentProfile.create({
        user: studentUser._id,
        course: 'B.Tech CSE',
        semester: 6,
      }),
      StudentProfile.create({
        user: student2User._id,
        course: 'B.Tech CSE',
        semester: 4,
      }),
      TeacherProfile.create({
        user: teacher1User._id,
        designation: 'Associate Professor',
        department: 'Computer Science and Engineering',
        officeLocation: 'Block A1, Cabin 304',
        verificationStatus: 'VERIFIED',
        isAcceptingBookings: true,
        weekendAvailability: true,
        campusBlock: 'A1',
        roomNumber: 'Cabin 304',
        researchDomains: ['Artificial Intelligence', 'Machine Learning', 'Cloud Computing'],
      }),
      TeacherProfile.create({
        user: teacher2User._id,
        designation: 'Assistant Professor',
        department: 'Computer Science and Engineering',
        officeLocation: 'Block B2, Cabin 102',
        verificationStatus: 'VERIFIED',
        isAcceptingBookings: true,
        campusBlock: 'B2',
        roomNumber: 'Cabin 102',
        researchDomains: ['Cybersecurity', 'Blockchain'],
      }),
    ]);

    teacher1ProfileId = tProf1._id.toString();
    teacher2ProfileId = tProf2._id.toString();

    // Create availability slots in parallel
    const futureDate1 = new Date(Date.now() + 86400000 * 2);
    futureDate1.setHours(10, 0, 0, 0);
    const endFutureDate1 = new Date(futureDate1.getTime() + 30 * 60000);

    const futureDate2 = new Date(Date.now() + 86400000 * 3);
    futureDate2.setHours(14, 0, 0, 0);
    const endFutureDate2 = new Date(futureDate2.getTime() + 30 * 60000);

    const futureDate3 = new Date(Date.now() + 86400000 * 4);
    futureDate3.setHours(11, 0, 0, 0);
    const endFutureDate3 = new Date(futureDate3.getTime() + 30 * 60000);

    const [s1, s2, s3] = await Promise.all([
      AvailabilitySlot.create({
        teacherProfile: teacher1ProfileId,
        startTime: futureDate1,
        endTime: endFutureDate1,
        durationMinutes: 30,
        locationType: 'CABIN',
        isBooked: false,
      }),
      AvailabilitySlot.create({
        teacherProfile: teacher1ProfileId,
        startTime: futureDate2,
        endTime: endFutureDate2,
        durationMinutes: 30,
        locationType: 'CABIN',
        isBooked: false,
      }),
      AvailabilitySlot.create({
        teacherProfile: teacher2ProfileId,
        startTime: futureDate3,
        endTime: endFutureDate3,
        durationMinutes: 30,
        locationType: 'CABIN',
        isBooked: false,
      }),
    ]);

    slot1Id = s1._id.toString();
    slot2Id = s2._id.toString();
    slot3Id = s3._id.toString();
  }, 120000);

  afterAll(async () => {
    // Cleanup created test records
    await Appointment.deleteMany({
      student: { $in: [studentId, student2Id] },
    });
    await AvailabilitySlot.deleteMany({
      teacherProfile: { $in: [teacher1ProfileId, teacher2ProfileId] },
    });
    await TeacherStudentRestriction.deleteMany({
      teacher: { $in: [teacher1UserId, teacher2UserId] },
    });
    await EmailLog.deleteMany({
      recipientEmail: { $regex: new RegExp(ts.toString()) },
    });
    await StudentProfile.deleteMany({
      user: { $in: [studentId, student2Id] },
    });
    await TeacherProfile.deleteMany({
      user: { $in: [teacher1UserId, teacher2UserId] },
    });
    await User.deleteMany({
      _id: { $in: [studentId, student2Id, teacher1UserId, teacher2UserId, adminUserId] },
    });
  });

  describe('1. 400-Word Agenda Validation', () => {
    it('should reject booking when agenda exceeds 400 words', async () => {
      // 405 words
      const longAgenda = Array(405).fill('research').join(' ');

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', studentCookie)
        .send({
          slotId: slot1Id,
          agenda: longAgenda,
          meetingMode: 'IN_PERSON',
          campusBlock: 'A1',
          roomNumber: 'Cabin 304',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/400 words/i);
    });

    it('should accept booking with valid agenda (under 400 words)', async () => {
      const validAgenda =
        'I would like to discuss my final year major project on Federated Machine Learning in Healthcare, including privacy guarantees and model evaluation techniques.';

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', studentCookie)
        .send({
          slotId: slot1Id,
          agenda: validAgenda,
          meetingMode: 'IN_PERSON',
          campusBlock: 'A1',
          roomNumber: 'Cabin 304',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.agenda).toBe(validAgenda);
      expect(res.body.data.appointment.campusBlock).toBe('A1');
      expect(res.body.data.appointment.attendanceStatus).toBe('NOT_MARKED');
    });
  });

  describe('2. Teacher Student Block / Unblock System', () => {
    it('should allow teacher to block a student with valid reason', async () => {
      const res = await request(app)
        .post('/api/v1/teachers/restrictions/block')
        .set('Cookie', teacher1Cookie)
        .send({
          studentId,
          reason: 'Repeated unexcused consultation no-shows and disruptive communication.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.restriction.isActive).toBe(true);
    });

    it('should reject booking from blocked student with 403 TEACHER_BLOCKED_STUDENT', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', studentCookie)
        .send({
          slotId: slot2Id,
          agenda: 'Need guidance on distributed database indexing.',
          meetingMode: 'IN_PERSON',
          campusBlock: 'A1',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('TEACHER_BLOCKED_STUDENT');
      expect(res.body.message).toMatch(/restricted/i);
    });

    it('should allow the blocked student to book with another teacher (Teacher 2)', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', studentCookie)
        .send({
          slotId: slot3Id,
          agenda: 'Need guidance on smart contract auditing and cryptography.',
          meetingMode: 'IN_PERSON',
          campusBlock: 'B2',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.teacherProfile).toBe(teacher2ProfileId);
    });

    it('should list blocked students with consultation and no-show stats', async () => {
      const res = await request(app)
        .get('/api/v1/teachers/restrictions')
        .set('Cookie', teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.blockedStudents)).toBe(true);
      const entry = res.body.data.blockedStudents.find(
        (b: any) => b.student._id === studentId
      );
      expect(entry).toBeDefined();
      expect(entry.reason).toMatch(/Repeated unexcused/);
      expect(entry.consultationCount).toBeGreaterThanOrEqual(1);
    });

    it('should allow teacher to unblock the student', async () => {
      const res = await request(app)
        .post('/api/v1/teachers/restrictions/unblock')
        .set('Cookie', teacher1Cookie)
        .send({
          studentId,
          reason: 'Student submitted formal explanation and resolution is complete.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.restriction.isActive).toBe(false);
    });

    it('should allow student to book Teacher 1 again after being unblocked', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Cookie', studentCookie)
        .send({
          slotId: slot2Id,
          agenda: 'Discussion on distributed system concurrency patterns.',
          meetingMode: 'IN_PERSON',
          campusBlock: 'A1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Consultation Attendance & No-Show Management', () => {
    let appointmentId: string;

    beforeAll(async () => {
      // Find an appointment for Teacher 1
      const appt = await Appointment.findOne({
        teacherProfile: teacher1ProfileId,
        student: studentId,
        status: 'PENDING',
      });
      if (appt) {
        appointmentId = appt._id.toString();
        // Approve it first
        await Appointment.findByIdAndUpdate(appointmentId, {
          status: 'ACCEPTED',
          approvedAt: new Date(),
        });
      }
    });

    it('should reject no-show marking if reason is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/attendance`)
        .set('Cookie', teacher1Cookie)
        .send({
          attendanceStatus: 'NO_SHOW',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/reason/i);
    });

    it('should allow teacher to mark NO_SHOW with mandatory reason', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/attendance`)
        .set('Cookie', teacher1Cookie)
        .send({
          attendanceStatus: 'NO_SHOW',
          noShowReason: 'Student was absent at Cabin 304 without notice.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.attendanceStatus).toBe('NO_SHOW');
      expect(res.body.data.appointment.noShowReason).toBe(
        'Student was absent at Cabin 304 without notice.'
      );
    });

    it('should allow student to appeal a no-show status', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/appeal-no-show`)
        .set('Cookie', studentCookie)
        .send({
          reason: 'I had an emergency medical lab test at CU Health Center.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const appealData = res.body.data.appointment?.noShowAppeal || res.body.data.appeal;
      expect(appealData.status).toBe('PENDING');
      expect(appealData.reason).toMatch(/emergency medical lab/i);
    });

    it('should allow admin to review and resolve student no-show appeal', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/review-appeal`)
        .set('Cookie', adminCookie)
        .send({
          status: 'RESOLVED',
          adminReviewNotes: 'Verified medical slip from Health Center. Converted to ATTENDED.',
          resetToAttended: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.attendanceStatus).toBe('ATTENDED');
      expect(res.body.data.appointment.noShowAppeal.status).toBe('RESOLVED');
    });

    it('should provide student attendance history report', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/attendance/history')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attendanceSummary).toBeDefined();
      expect(res.body.data.attendanceSummary.attendedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Transactional Email System & Reminders', () => {
    it('should log transactional emails to EmailLog collection', async () => {
      const sent = await emailService.sendEmail({
        to: `notify_${ts}@cuchd.in`,
        subject: 'CUCampusSaathi Consultation Scheduled',
        html: '<p>Your consultation is scheduled</p>',
        templateType: 'APPOINTMENT_REQUESTED',
        idempotencyKey: `test_idem_${ts}`,
      });

      expect(sent).toBe(true);

      const log = await EmailLog.findOne({ idempotencyKey: `test_idem_${ts}` });
      expect(log).toBeDefined();
      expect(['DELIVERED', 'MOCKED']).toContain(log?.status);
      expect(log?.templateType).toBe('APPOINTMENT_REQUESTED');
    });

    it('should be idempotent and not duplicate emails with the same idempotency key', async () => {
      const sentDuplicate = await emailService.sendEmail({
        to: `notify_${ts}@cuchd.in`,
        subject: 'Duplicate Request',
        html: '<p>Duplicate</p>',
        templateType: 'APPOINTMENT_REQUESTED',
        idempotencyKey: `test_idem_${ts}`,
      });

      expect(sentDuplicate).toBe(true);

      const count = await EmailLog.countDocuments({
        idempotencyKey: `test_idem_${ts}`,
      });
      expect(count).toBe(1);
    });
  });

  describe('5. Admin Restrictions Overview & Override', () => {
    let activeRestrictionId: string;

    beforeAll(async () => {
      // Create a new restriction by Teacher 2 on Student 2
      const rest = await TeacherStudentRestriction.create({
        teacher: teacher2UserId,
        student: student2Id,
        blockedBy: teacher2UserId,
        reason: 'Violation of consultation etiquette guidelines.',
        isActive: true,
      });
      activeRestrictionId = rest._id.toString();
    });

    it('should allow admin to list all teacher restrictions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/restrictions')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.restrictions)).toBe(true);
      const found = res.body.data.restrictions.find(
        (r: any) => r._id === activeRestrictionId
      );
      expect(found).toBeDefined();
    });

    it('should allow admin to override and lift restriction', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/restrictions/${activeRestrictionId}/override`)
        .set('Cookie', adminCookie)
        .send({
          reason: 'Administrative dispute resolution completed.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.restriction.isActive).toBe(false);
      expect(res.body.data.restriction.unblockedByAdmin).toBe(true);
    });
  });
});
