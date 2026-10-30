import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { ContactMessage } from '../models/ContactMessage';
import { PasswordReset } from '../models/PasswordReset';
import { hashPassword } from '../utils/password';

const app = createApp();

describe('Contact Support & Password Recovery Endpoints', () => {
  const ts = Date.now();
  const testEmail = `test_recovery_${ts}@cuchd.in`;

  beforeAll(async () => {
    await connectDatabase();
    const pwdHash = await hashPassword('RecoveryTest@123');
    await User.create({
      fullName: 'Recovery Tester',
      email: testEmail,
      uid: `REC${ts.toString().slice(-6)}`,
      passwordHash: pwdHash,
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      isVerified: true,
      accountStatus: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /test_recovery_/ });
    await ContactMessage.deleteMany({ email: /test_/ });
    await PasswordReset.deleteMany({});
    await disconnectDatabase();
  });

  describe('POST /api/v1/contact', () => {
    it('successfully submits a valid inquiry and creates a database record', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          fullName: 'Test Inquirer',
          email: `test_contact_${ts}@cuchd.in`,
          userType: 'Student',
          subject: 'Academic Collaboration Inquiry',
          message: 'Hello, I have a question regarding faculty office hours scheduling.',
          privacyConsent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketId).toBeDefined();

      const saved = await ContactMessage.findById(res.body.data.ticketId);
      expect(saved).not.toBeNull();
      expect(saved?.fullName).toBe('Test Inquirer');
      expect(saved?.status).toBe('NEW');
    });

    it('rejects inquiry missing privacy consent with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          fullName: 'Test Inquirer',
          email: `test_contact_${ts}@cuchd.in`,
          userType: 'Student',
          subject: 'Academic Collaboration Inquiry',
          message: 'Hello, I have a question regarding faculty office hours scheduling.',
          privacyConsent: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects short messages under 10 characters', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          fullName: 'Test Inquirer',
          email: `test_contact_${ts}@cuchd.in`,
          userType: 'Student',
          subject: 'Short message test',
          message: 'Too short',
          privacyConsent: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('generates a password reset token for registered university user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: testEmail });
      const record = await PasswordReset.findOne({ user: user?._id });
      expect(record).not.toBeNull();
      expect(record?.used).toBe(false);
      expect(record?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns generic success even if user does not exist (enumeration prevention)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent_account_9999@cuchd.in' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid email formats with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email-format' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

