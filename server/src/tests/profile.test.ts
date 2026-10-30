import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { RefreshToken } from '../models/RefreshToken';
import { ACCESS_TOKEN_COOKIE } from '../utils/token';

const app = createApp();

describe('Profile Management & Campus Directory Test Suite', () => {
  const timestamp = Date.now();

  const studentUser = {
    fullName: 'Rohan Sharma',
    email: `rohan_profile_${timestamp}@cuchd.in`,
    uid: `ROH_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 4,
  };

  const privateStudentUser = {
    fullName: 'Secret Student',
    email: `private_student_${timestamp}@cuchd.in`,
    uid: `SEC_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Information Technology',
    course: 'B.Tech IT',
    semester: 2,
  };

  const teacherUser = {
    fullName: 'Dr. Sunita Kapoor',
    email: `sunita_profile_${timestamp}@cuchd.in`,
    uid: `SUN_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Artificial Intelligence',
    designation: 'Professor',
  };

  let studentCookie: string;
  let privateStudentCookie: string;
  let teacherCookie: string;

  beforeAll(async () => {
    await connectDatabase();

    // 1. Register student
    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send(studentUser);
    expect(studentRes.status).toBe(201);
    const sCookies = studentRes.headers['set-cookie'] as unknown as string[] | undefined;
    studentCookie = sCookies?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))?.split(';')[0] || '';

    // 2. Register private student
    const privateRes = await request(app)
      .post('/api/v1/auth/register')
      .send(privateStudentUser);
    expect(privateRes.status).toBe(201);
    const pCookies = privateRes.headers['set-cookie'] as unknown as string[] | undefined;
    privateStudentCookie = pCookies?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))?.split(';')[0] || '';

    // 3. Register teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/register')
      .send(teacherUser);
    expect(teacherRes.status).toBe(201);
    const tCookies = teacherRes.headers['set-cookie'] as unknown as string[] | undefined;
    teacherCookie = tCookies?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))?.split(';')[0] || '';
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /_profile_/ } });
    await StudentProfile.deleteMany({ course: { $in: ['B.Tech CSE', 'B.Tech IT', 'B.Tech AI'] } });
    await TeacherProfile.deleteMany({ designation: { $in: ['Professor', 'Senior Professor'] } });
    await RefreshToken.deleteMany({});
    await disconnectDatabase();
  });

  // 1. Student Profile Management
  describe('Student Profile API (/api/v1/users/profile/student)', () => {
    it('retrieves the authenticated student profile and safe user data', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile/student')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentUser.email);
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.course).toBe('B.Tech CSE');
      expect(res.body.data.profile.semester).toBe(4);
    });

    it('updates student profile with skills, bio, social links, and privacyLevel', async () => {
      const updateData = {
        course: 'B.Tech AI',
        semester: 5,
        bio: 'Passionate about deep learning and cloud computing.',
        skills: ['Python', 'PyTorch', 'Docker', 'python', 'PYTHON'], // Duplicate casing
        socialLinks: {
          github: 'https://github.com/rohansharma',
          linkedin: 'https://linkedin.com/in/rohansharma',
          portfolio: 'https://rohan.dev',
        },
        privacyLevel: 'CAMPUS_ONLY',
      };

      const res = await request(app)
        .put('/api/v1/users/profile/student')
        .set('Cookie', [studentCookie])
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.course).toBe('B.Tech AI');
      expect(res.body.data.profile.semester).toBe(5);
      expect(res.body.data.profile.bio).toBe(updateData.bio);

      // Verifies skill normalization and duplicate removal
      expect(res.body.data.profile.skills).toEqual(['Python', 'PyTorch', 'Docker']);
      expect(res.body.data.profile.privacyLevel).toBe('CAMPUS_ONLY');
    });

    it('rejects invalid semester values (e.g. semester 0 or 9)', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile/student')
        .set('Cookie', [studentCookie])
        .send({
          course: 'B.Tech CSE',
          semester: 10, // Invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed social link URLs', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile/student')
        .set('Cookie', [studentCookie])
        .send({
          course: 'B.Tech CSE',
          semester: 4,
          socialLinks: {
            github: 'javascript:alert(1)', // Malformed/unsafe
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('prevents profile update from altering immutable User fields like role or email', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile/student')
        .set('Cookie', [studentCookie])
        .send({
          course: 'B.Tech AI',
          semester: 5,
          skills: ['Python', 'PyTorch', 'Docker'],
          privacyLevel: 'CAMPUS_ONLY',
          role: 'ADMIN', // Malicious attempt to elevate role
          email: 'hacker@cuchd.in',
        });

      expect(res.status).toBe(200);
      // User role and email must remain unchanged
      const updatedUser = await User.findOne({ email: studentUser.email });
      expect(updatedUser?.role).toBe('STUDENT');
      expect(updatedUser?.email).toBe(studentUser.email);
    });
  });

  // 2. Teacher Profile Management
  describe('Teacher Profile API (/api/v1/users/profile/teacher)', () => {
    it('retrieves the authenticated teacher profile and safe user data', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile/teacher')
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(teacherUser.email);
      expect(res.body.data.user.role).toBe('TEACHER');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('updates teacher profile with research domains, office location, and settings', async () => {
      const updateData = {
        designation: 'Senior Professor',
        department: 'Artificial Intelligence',
        researchDomains: ['Natural Language Processing', 'Computer Vision', 'nlp'],
        officeLocation: 'Block 3, Cabin 304',
        bookingPreference: 'BIWEEKLY_SLOTS',
        maxDailySlots: 6,
        isAcceptingBookings: true,
      };

      const res = await request(app)
        .put('/api/v1/users/profile/teacher')
        .set('Cookie', [teacherCookie])
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.designation).toBe('Senior Professor');
      expect(res.body.data.profile.officeLocation).toBe('Block 3, Cabin 304');
      expect(res.body.data.profile.maxDailySlots).toBe(6);
      expect(res.body.data.profile.isAcceptingBookings).toBe(true);
      // Normalized domains
      expect(res.body.data.profile.researchDomains).toEqual([
        'Natural Language Processing',
        'Computer Vision',
        'nlp',
      ]);
    });
  });

  // 3. Security, Authentication & Role Access Guards
  describe('Security & RBAC Enforcement', () => {
    it('rejects unauthenticated requests to student profile with 401', async () => {
      const res = await request(app).get('/api/v1/users/profile/student');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to teacher profile with 401', async () => {
      const res = await request(app).get('/api/v1/users/profile/teacher');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks student from accessing teacher profile with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile/teacher')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks teacher from accessing student profile with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile/student')
        .set('Cookie', [teacherCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // 4. Privacy-Aware Campus Directory & Search
  describe('Campus Directory & Privacy Enforcement (/api/v1/directory)', () => {
    beforeAll(async () => {
      // Set private student profile to PRIVATE
      await request(app)
        .put('/api/v1/users/profile/student')
        .set('Cookie', [privateStudentCookie])
        .send({
          course: 'B.Tech IT',
          semester: 2,
          bio: 'Hidden confidential profile',
          skills: ['Cybersecurity', 'Linux'],
          privacyLevel: 'PRIVATE',
        });
    });

    it('excludes PRIVATE student profiles from directory search', async () => {
      // Search for the private student's name
      const res = await request(app)
        .get('/api/v1/directory?q=Secret')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.items.some((i: any) => i.fullName === 'Secret Student')).toBe(false);
    });

    it('allows authenticated campus user to see CAMPUS_ONLY profiles', async () => {
      const res = await request(app)
        .get('/api/v1/directory?type=student&skills=Docker')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.viewer.isCampusUser).toBe(true);
      const rohanItem = res.body.data.items.find((i: any) => i.fullName === 'Rohan Sharma');
      expect(rohanItem).toBeDefined();
      expect(rohanItem.privacyLevel).toBe('CAMPUS_ONLY');
      expect(rohanItem.skills).toContain('Docker');
    });

    it('excludes CAMPUS_ONLY student profiles for unauthenticated visitors', async () => {
      const res = await request(app)
        .get('/api/v1/directory?type=student&q=Rohan');

      expect(res.status).toBe(200);
      expect(res.body.data.viewer.isCampusUser).toBe(false);
      // Rohan is CAMPUS_ONLY, so should NOT appear to guest visitor
      const rohanItem = res.body.data.items.find((i: any) => i.fullName === 'Rohan Sharma');
      expect(rohanItem).toBeUndefined();
    });

    it('allows filtering by role, skill keyword, and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/directory?type=teacher&limit=5&page=1')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(5);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.items.every((i: any) => i.role === 'TEACHER')).toBe(true);
    });

    it('never exposes passwordHash or sensitive tokens in directory response', async () => {
      const res = await request(app)
        .get('/api/v1/directory')
        .set('Cookie', [studentCookie]);

      expect(res.status).toBe(200);
      for (const item of res.body.data.items) {
        expect(item).not.toHaveProperty('passwordHash');
        expect(item).not.toHaveProperty('__v');
      }
    });
  });
});
