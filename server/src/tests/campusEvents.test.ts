import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User, CampusEvent, EventRegistration, EventReminderLog } from '../models';
import { env } from '../config/env';
import { ACCESS_TOKEN_COOKIE } from '../utils/token';

const app = createApp();

describe('Campus Events Calendar Module — Integration Test Suite', () => {
  let teacherCookie: string;
  let studentCookie: string;
  let teacherId: string;
  let studentId: string;

  let createdEventId: string;
  let publishedEventId: string;
  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 1. Create Teacher
    const tEmail = `prof.events${testSuffix}@cuchd.in`;
    const tRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: `Prof Events Organizer ${testSuffix}`,
        email: tEmail,
        uid: `TEA_EV_${testSuffix}`.slice(0, 15),
        password: 'Password123!',
        role: 'TEACHER',
        department: 'Apex Institute of Technology',
        designation: 'Associate Professor',
      });
    teacherCookie = (tRes.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';
    teacherId = tRes.body.data?.user?.id || tRes.body.data?.user?._id;
    if (!teacherCookie) {
      console.log('Teacher register failed:', tRes.status, JSON.stringify(tRes.body));
    }

    // 2. Create Student
    const sEmail = `student.events${testSuffix}@cuchd.in`;
    const sRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: `Student Events Attendee ${testSuffix}`,
        email: sEmail,
        uid: `STU_EV_${testSuffix}`.slice(0, 15),
        password: 'Password123!',
        role: 'STUDENT',
        department: 'Computer Science & Engineering',
        course: 'B.Tech CSE',
        semester: 6,
      });
    studentCookie = (sRes.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c: string) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0] || '';
    studentId = sRes.body.data?.user?.id || sRes.body.data?.user?._id;
    if (!studentCookie) {
      console.log('Student register failed:', sRes.status, JSON.stringify(sRes.body));
    }
  }, 35000);

  afterAll(async () => {
    if (teacherId || studentId) {
      await Promise.all([
        CampusEvent.deleteMany({ createdBy: { $in: [teacherId, studentId] } }),
        EventRegistration.deleteMany({ user: { $in: [teacherId, studentId] } }),
        EventReminderLog.deleteMany({ user: { $in: [teacherId, studentId] } }),
        User.deleteMany({ _id: { $in: [teacherId, studentId] } }),
      ]);
    }
  });

  it('1. Teacher creates an event in DRAFT status', async () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const tomorrowEnd = new Date(Date.now() + 27 * 3600 * 1000);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', [teacherCookie])
      .send({
        title: `AI & Cloud Hackathon ${testSuffix}`,
        category: 'Hackathons',
        shortDescription: 'Join 500+ students for an all-night AI innovation hackathon.',
        description: 'Comprehensive guidelines for the annual university hackathon across campus labs with awards and mentorship.',
        startDateTime: tomorrow.toISOString(),
        endDateTime: tomorrowEnd.toISOString(),
        mode: 'OFFLINE',
        campusBlock: 'Block D3',
        venue: 'Main Auditorium',
        roomNumber: 'Auditorium A',
        organizerName: 'Apex Institute of Technology',
        registrationEnabled: true,
        capacity: 50,
        status: 'DRAFT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    createdEventId = res.body.data._id;
  });

  it('2. Public calendar DOES NOT show draft events to unauthenticated visitors', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .query({ search: testSuffix });

    expect(res.status).toBe(200);
    const found = res.body.data.find((e: any) => e._id === createdEventId);
    expect(found).toBeUndefined();
  });

  it('3. Teacher can view their own draft events in manage portal', async () => {
    const res = await request(app)
      .get('/api/v1/events/manage/mine')
      .set('Cookie', [teacherCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.data.find((e: any) => e._id === createdEventId);
    expect(found).toBeDefined();
    expect(found.status).toBe('DRAFT');
  });

  it('4. Teacher publishes the event to public calendar', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${createdEventId}/publish`)
      .set('Cookie', [teacherCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
    publishedEventId = createdEventId;
  });

  it('5. Public calendar now displays the published event without login', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .query({ search: testSuffix });

    expect(res.status).toBe(200);
    const found = res.body.data.find((e: any) => e._id === publishedEventId);
    expect(found).toBeDefined();
    expect(found.title).toContain(testSuffix);
  });

  it('6. Public event details page is accessible without login', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${publishedEventId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain(testSuffix);
    expect(res.body.data.isRegistered).toBe(false);
  });

  it('7. Unauthenticated registration attempt is rejected (Login required)', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${publishedEventId}/register`);

    expect(res.status).toBe(401);
  });

  it('8. Authenticated student registers for the event', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${publishedEventId}/register`)
      .set('Cookie', [studentCookie]);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REGISTERED');

    // Verify registered count incremented
    const eventRes = await request(app).get(`/api/v1/events/${publishedEventId}`);
    expect(eventRes.body.data.registeredCount).toBe(1);
  });

  it('9. Duplicate registration is prevented', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${publishedEventId}/register`)
      .set('Cookie', [studentCookie]);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already registered');
  });

  it('10. Teacher can view registered attendees roster', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${publishedEventId}/registrations`)
      .set('Cookie', [teacherCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].user._id).toBe(studentId);
  });

  it('11. Student can unregister from the event', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${publishedEventId}/unregister`)
      .set('Cookie', [studentCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify count decremented
    const eventRes = await request(app).get(`/api/v1/events/${publishedEventId}`);
    expect(eventRes.body.data.registeredCount).toBe(0);
  });

  it('12. Teacher can cancel the event with mandatory remarks', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${publishedEventId}/cancel`)
      .set('Cookie', [teacherCookie])
      .send({
        reason: 'Rescheduled due to university convocation week.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.data.cancellationReason).toContain('convocation');
  });
});
