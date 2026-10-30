import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, verifyPassword } from '../utils/password';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../utils/token';

const app = createApp();

describe('Auth & RBAC Test Suite', () => {
  const timestamp = Date.now();
  const testStudent = {
    fullName: 'Test Student QA',
    email: `student_qa_${timestamp}@cuchd.in`,
    uid: `QA_${timestamp}`.slice(0, 15),
    password: 'Password123!@#',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CSE',
    semester: 4,
  };

  const testTeacher = {
    fullName: 'Test Teacher QA',
    email: `teacher_qa_${timestamp}@cuchd.in`,
    uid: `TQA_${timestamp}`.slice(0, 15),
    password: 'TeacherPass123!@#',
    role: 'TEACHER',
    department: 'Artificial Intelligence',
    designation: 'Assistant Professor',
  };

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    // Clean up test fixtures created during the test run
    await User.deleteMany({ email: { $regex: /_qa_/ } });
    await StudentProfile.deleteMany({});
    await RefreshToken.deleteMany({});
    await disconnectDatabase();
  });

  // 1. Password Hashing with Argon2id
  describe('Password Hashing (Argon2id)', () => {
    it('hashes passwords with Argon2id and verifies correctly', async () => {
      const plaintext = 'SecurePass_2026!#';
      const hash = await hashPassword(plaintext);

      expect(hash).toContain('$argon2id$');
      expect(hash).not.toEqual(plaintext);

      const isValid = await verifyPassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword123!', hash);
      expect(isInvalid).toBe(false);
    });
  });

  // 2. Registration Endpoint
  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a student and returns safe user data with cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testStudent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.role).toBe('STUDENT');
      // Crucial security check: passwordHash must NOT be in the response
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check cookies were set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes(ACCESS_TOKEN_COOKIE))).toBe(true);
      expect(cookies.some((c: string) => c.includes(REFRESH_TOKEN_COOKIE))).toBe(true);
    });

    it('rejects attempted Admin self-registration via public API', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: `admin_hack_${timestamp}@cuchd.in`,
          uid: `HACK_${timestamp}`.slice(0, 15),
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Administrative accounts cannot be self-registered');
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          uid: `DIFF_UID_${timestamp}`.slice(0, 15),
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email address already exists');
    });

    it('rejects duplicate UID registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: `different_email_${timestamp}@cuchd.in`,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('UID or Faculty ID already exists');
    });

    it('rejects invalid email and weak password formats', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: 'invalid-email-format',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. Login Endpoint
  describe('POST /api/v1/auth/login', () => {
    it('successfully logs in with email and sets authentication cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testStudent.email,
          password: testStudent.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes(ACCESS_TOKEN_COOKIE))).toBe(true);
      expect(cookies.some((c: string) => c.includes(REFRESH_TOKEN_COOKIE))).toBe(true);
    });

    it('successfully logs in with UID instead of email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testStudent.uid,
          password: testStudent.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.uid).toBe(testStudent.uid);
    });

    it('fails login with incorrect password with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testStudent.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email/UID or password.');
    });

    it('fails login with non-existent user with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent_user_999@cuchd.in',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email/UID or password.');
    });
  });

  // 4. Token Protected Route and Role Guards
  describe('RBAC & Route Protection', () => {
    let studentAuthCookie: string;
    let teacherAuthCookie: string;

    beforeAll(async () => {
      // Register teacher
      const tReg = await request(app).post('/api/v1/auth/register').send(testTeacher);
      const tCookies = tReg.headers['set-cookie'] as unknown as string[];
      teacherAuthCookie = tCookies.find((c: string) => c.includes(ACCESS_TOKEN_COOKIE)) || '';

      // Login student to get fresh cookie
      const sLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: testStudent.email,
        password: testStudent.password,
      });
      const sCookies = sLogin.headers['set-cookie'] as unknown as string[];
      studentAuthCookie = sCookies.find((c: string) => c.includes(ACCESS_TOKEN_COOKIE)) || '';
    });

    it('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me returns current user profile with valid cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [studentAuthCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user.profile).toBeDefined();
    });

    it('permits student to access student-only route and denies access to teacher-only route', async () => {
      // 1. Allowed on student-only
      const allowed = await request(app)
        .get('/api/v1/test/student-only')
        .set('Cookie', [studentAuthCookie]);
      expect(allowed.status).toBe(200);
      expect(allowed.body.success).toBe(true);

      // 2. Denied on teacher-only (403 Forbidden)
      const denied = await request(app)
        .get('/api/v1/test/teacher-only')
        .set('Cookie', [studentAuthCookie]);
      expect(denied.status).toBe(403);
      expect(denied.body.success).toBe(false);
      expect(denied.body.message).toContain('Forbidden');
    });

    it('permits teacher to access teacher-only route and denies access to admin-only route', async () => {
      const allowed = await request(app)
        .get('/api/v1/test/teacher-only')
        .set('Cookie', [teacherAuthCookie]);
      expect(allowed.status).toBe(200);

      const denied = await request(app)
        .get('/api/v1/test/admin-only')
        .set('Cookie', [teacherAuthCookie]);
      expect(denied.status).toBe(403);
    });
  });

  // 5. Refresh Token Rotation & Logout
  describe('POST /api/v1/auth/refresh & /logout', () => {
    let refreshCookie: string;

    beforeAll(async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testStudent.email,
        password: testStudent.password,
      });
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      refreshCookie = cookies.find((c: string) => c.includes(REFRESH_TOKEN_COOKIE)) || '';
    });

    it('rotates refresh token and issues new tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c: string) => c.includes(ACCESS_TOKEN_COOKIE))).toBe(true);
      expect(newCookies.some((c: string) => c.includes(REFRESH_TOKEN_COOKIE))).toBe(true);

      // Verify the old refresh token was revoked by attempting to use it again
      const replayAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(replayAttempt.status).toBe(401);
    });

    it('logs out and clears cookies properly', async () => {
      // Get fresh session
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: testStudent.email,
        password: testStudent.password,
      });
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const rCookie = cookies.find((c: string) => c.includes(REFRESH_TOKEN_COOKIE)) || '';

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [rCookie]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify cookies are expired/cleared
      const clearedCookies = logoutRes.headers['set-cookie'] as unknown as string[];
      expect(clearedCookies.some((c: string) => c.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
    });
  });
});
