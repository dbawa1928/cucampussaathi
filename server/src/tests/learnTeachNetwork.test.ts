import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import {
  User,
  SkillModel,
  TeachingListingModel,
  LearningGoalModel,
  SkillConnectionModel,
  LearningSessionModel,
  LearningGroupModel,
  GroupMembershipModel,
  LearningMessageModel,
  LearningReviewModel,
  SkillProgressModel,
  LearnTeachReportModel,
} from '../models';
import { env } from '../config/env';

const app = createApp();

describe('Learn & Teach Network — End-to-End Test Suite', () => {
  let studentCookie: string;
  let teacherCookie: string;
  let student2Cookie: string;

  let studentId: string;
  let teacherId: string;
  let student2Id: string;

  let testSkillId: string;
  let javaSkillId: string;
  let reactSkillId: string;

  let studentTeachingListingId: string;
  let teacherTeachingListingId: string;

  let studentLearningGoalId: string;
  let connectionId: string;
  let sessionId: string;
  let groupId: string;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 1. Register Student 1
    const s1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: `Aarav Student ${testSuffix}`,
        email: `aarav_lt_${testSuffix}@cuchd.in`,
        uid: `STU_LT1_${testSuffix}`,
        password: 'Password123!',
        role: 'STUDENT',
        department: 'Computer Science and Engineering',
      });
    studentCookie = s1Res.headers['set-cookie']?.[0] || '';
    studentId = s1Res.body.data.user.id || s1Res.body.data.user._id;

    // 2. Register Teacher
    const tRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: `Prof. Rajesh Sharma ${testSuffix}`,
        email: `rajesh_lt_${testSuffix}@cuchd.in`,
        uid: `TEA_LT_${testSuffix}`,
        password: 'Password123!',
        role: 'TEACHER',
        department: 'Computer Science and Engineering',
      });
    teacherCookie = tRes.headers['set-cookie']?.[0] || '';
    teacherId = tRes.body.data.user.id || tRes.body.data.user._id;

    // 3. Register Student 2
    const s2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: `Priya Kaur ${testSuffix}`,
        email: `priya_lt_${testSuffix}@cuchd.in`,
        uid: `STU_LT2_${testSuffix}`,
        password: 'Password123!',
        role: 'STUDENT',
        department: 'Computer Science and Engineering',
      });
    student2Cookie = s2Res.headers['set-cookie']?.[0] || '';
    student2Id = s2Res.body.data.user.id || s2Res.body.data.user._id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await Promise.all([
      User.deleteMany({ _id: { $in: [studentId, teacherId, student2Id] } }),
      TeachingListingModel.deleteMany({ user: { $in: [studentId, teacherId, student2Id] } }),
      LearningGoalModel.deleteMany({ user: { $in: [studentId, teacherId, student2Id] } }),
      SkillConnectionModel.deleteMany({
        $or: [
          { sender: { $in: [studentId, teacherId, student2Id] } },
          { receiver: { $in: [studentId, teacherId, student2Id] } },
        ],
      }),
      LearningSessionModel.deleteMany({ teacher: { $in: [studentId, teacherId, student2Id] } }),
      LearningGroupModel.deleteMany({ creator: { $in: [studentId, teacherId, student2Id] } }),
      GroupMembershipModel.deleteMany({ user: { $in: [studentId, teacherId, student2Id] } }),
      LearningMessageModel.deleteMany({ sender: { $in: [studentId, teacherId, student2Id] } }),
      LearningReviewModel.deleteMany({ reviewer: { $in: [studentId, teacherId, student2Id] } }),
      SkillProgressModel.deleteMany({ user: { $in: [studentId, teacherId, student2Id] } }),
      LearnTeachReportModel.deleteMany({ reporter: { $in: [studentId, teacherId, student2Id] } }),
    ]);
  });

  describe('1. Skill Catalogue API', () => {
    it('seeds and returns normalized university skills', async () => {
      const res = await request(app).get('/api/v1/learn-teach/skills');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(10);

      const python = res.body.data.find((s: any) => s.normalizedName === 'python');
      expect(python).toBeDefined();
      testSkillId = python._id;

      const java = res.body.data.find((s: any) => s.normalizedName === 'java');
      if (java) javaSkillId = java._id;

      const react = res.body.data.find((s: any) => s.normalizedName === 'react');
      if (react) reactSkillId = react._id;
    });

    it('filters skills by search keyword', async () => {
      const res = await request(app).get('/api/v1/learn-teach/skills?search=python');
      expect(res.status).toBe(200);
      expect(res.body.data.some((s: any) => s.name.toLowerCase().includes('python'))).toBe(true);
    });
  });

  describe('2. Teaching Listings (I Can Teach)', () => {
    it('allows a student to publish a teaching skill', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/teaching')
        .set('Cookie', studentCookie)
        .send({
          skillName: 'React',
          category: 'Web Development',
          expertiseLevel: 'ADVANCED',
          experienceMonths: 18,
          description: 'Experienced in React 19, hooks, state management, and modern component design.',
          teachingMode: 'BOTH',
          teachingType: 'BOTH',
          languages: ['English', 'Hindi'],
          maxLearners: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skillName).toBe('React');
      expect(res.body.data.expertiseLevel).toBe('ADVANCED');
      studentTeachingListingId = res.body.data._id;
    });

    it('prevents publishing a duplicate listing for the same skill', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/teaching')
        .set('Cookie', studentCookie)
        .send({
          skillName: 'React',
          category: 'Web Development',
          expertiseLevel: 'EXPERT',
          experienceMonths: 24,
          description: 'Another duplicate listing attempt for React.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have a published listing');
    });

    it('allows a teacher to also publish a teaching skill', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/teaching')
        .set('Cookie', teacherCookie)
        .send({
          skillName: 'Java',
          category: 'Programming & Development',
          expertiseLevel: 'EXPERT',
          experienceMonths: 60,
          description: 'University faculty teaching Advanced Java, concurrency, and Spring Boot.',
          teachingMode: 'ONLINE',
          teachingType: 'INDIVIDUAL',
          languages: ['English'],
          maxLearners: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      teacherTeachingListingId = res.body.data._id;
    });

    it('retrieves user teaching listings', async () => {
      const res = await request(app)
        .get('/api/v1/learn-teach/teaching/mine')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]._id).toBe(studentTeachingListingId);
    });

    it('updates a teaching listing successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/learn-teach/teaching/${studentTeachingListingId}`)
        .set('Cookie', studentCookie)
        .send({
          maxLearners: 8,
          teachingMode: 'ONLINE',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.maxLearners).toBe(8);
      expect(res.body.data.teachingMode).toBe('ONLINE');
    });
  });

  describe('3. Learning Goals (I Want to Learn)', () => {
    it('allows a student to publish a learning goal', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/goals')
        .set('Cookie', studentCookie)
        .send({
          skillName: 'Java',
          category: 'Programming & Development',
          currentLevel: 'BEGINNER',
          targetLevel: 'INTERMEDIATE',
          learningObjective: 'Master object oriented programming and pass university Java lab with high grade.',
          preferredMode: 'BOTH',
          preferredLanguages: ['English', 'Hindi'],
          urgency: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skillName).toBe('Java');
      studentLearningGoalId = res.body.data._id;
    });

    it('creates corresponding skill progress tracker automatically', async () => {
      const res = await request(app)
        .get('/api/v1/learn-teach/progress')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p.skillName === 'Java')).toBe(true);
    });

    it('allows a teacher to also set a learning goal', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/goals')
        .set('Cookie', teacherCookie)
        .send({
          skillName: 'React',
          category: 'Web Development',
          currentLevel: 'BEGINNER',
          targetLevel: 'INTERMEDIATE',
          learningObjective: 'Learn modern React 19 component architecture to build interactive academic tools.',
          preferredMode: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Discovery & Recommendation Engine', () => {
    it('discovers suitable peers with teaching skills', async () => {
      const res = await request(app)
        .get('/api/v1/learn-teach/discover?skill=Java')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.people.length).toBeGreaterThanOrEqual(1);
      const foundTeacher = res.body.data.people.find(
        (p: any) => p.user._id === teacherId
      );
      expect(foundTeacher).toBeDefined();
    });

    it('identifies mutual skill exchange in recommendations', async () => {
      // Student 1 teaches React and wants Java
      // Teacher teaches Java and wants React
      const res = await request(app)
        .get('/api/v1/learn-teach/recommendations')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const teacherMatch = res.body.data.find(
        (r: any) => r.candidateUser._id === teacherId
      );
      expect(teacherMatch).toBeDefined();
      expect(teacherMatch.isMutualExchange).toBe(true);
      expect(teacherMatch.compatibilityScore).toBeGreaterThanOrEqual(75);
      expect(teacherMatch.matchReasons.some((r: string) => r.includes('Mutual Skill-Exchange'))).toBe(true);
    });
  });

  describe('5. Connection Request Lifecycle', () => {
    it('sends a connection request from student to teacher', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/connections')
        .set('Cookie', studentCookie)
        .send({
          receiverId: teacherId,
          skillId: javaSkillId || testSkillId,
          requestMessage: 'Hello Professor, I would love to learn Java core concepts and multithreading from you.',
          preferredMode: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      connectionId = res.body.data._id;
    });

    it('rejects sending duplicate connection request while pending', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/connections')
        .set('Cookie', studentCookie)
        .send({
          receiverId: teacherId,
          skillId: javaSkillId || testSkillId,
          requestMessage: 'Duplicate request attempt.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already pending');
    });

    it('prevents self-connection requests', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/connections')
        .set('Cookie', studentCookie)
        .send({
          receiverId: studentId,
          skillId: javaSkillId || testSkillId,
          requestMessage: 'Self connection attempt.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot send a connection request to yourself');
    });

    it('allows teacher to accept the connection request', async () => {
      const res = await request(app)
        .post(`/api/v1/learn-teach/connections/${connectionId}/accept`)
        .set('Cookie', teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
    });
  });

  describe('6. Private Learning Chat', () => {
    it('allows accepted connection partners to exchange private messages', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/messages')
        .set('Cookie', studentCookie)
        .send({
          connectionId,
          content: 'Hello Professor! When would be a good time for our first session on Java OOP?',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toContain('Java OOP');
    });

    it('retrieves conversation history for accepted partners', async () => {
      const res = await request(app)
        .get(`/api/v1/learn-teach/messages?connectionId=${connectionId}`)
        .set('Cookie', teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('denies non-participant from reading connection messages', async () => {
      const res = await request(app)
        .get(`/api/v1/learn-teach/messages?connectionId=${connectionId}`)
        .set('Cookie', student2Cookie);

      expect(res.status).toBe(403);
    });
  });

  describe('7. Learning Sessions', () => {
    it('allows proposing a learning session', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/learn-teach/sessions')
        .set('Cookie', teacherCookie)
        .send({
          connectionId,
          sessionTitle: 'Java Classes, Objects & Memory Model',
          description: 'Hands on deep-dive into JVM stack and heap memory.',
          date: dateStr,
          startTime: '16:00',
          endTime: '17:00',
          mode: 'ONLINE',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PROPOSED');
      sessionId = res.body.data._id;
    });

    it('allows learner to accept the session proposal', async () => {
      const res = await request(app)
        .post(`/api/v1/learn-teach/sessions/${sessionId}/accept`)
        .set('Cookie', studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('completes the session', async () => {
      const res = await request(app)
        .post(`/api/v1/learn-teach/sessions/${sessionId}/complete`)
        .set('Cookie', teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('8. Reviews and Progress Tracking', () => {
    it('allows student to submit review for completed session', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/reviews')
        .set('Cookie', studentCookie)
        .send({
          sessionId,
          rating: 5,
          feedback: 'Excellent explanation of Java heap vs stack! Super helpful mentor.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
    });

    it('prevents duplicate reviews for the same session', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/reviews')
        .set('Cookie', studentCookie)
        .send({
          sessionId,
          rating: 4,
          feedback: 'Second review attempt.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already submitted a review');
    });

    it('allows learner to toggle milestone on progress tracker', async () => {
      const progressRes = await request(app)
        .get('/api/v1/learn-teach/progress')
        .set('Cookie', studentCookie);

      const javaProgress = progressRes.body.data.find((p: any) => p.skillName === 'Java');
      expect(javaProgress).toBeDefined();

      const milestoneId = javaProgress.milestones[0].id;
      const toggleRes = await request(app)
        .patch(`/api/v1/learn-teach/progress/${javaProgress._id}/milestones/${milestoneId}`)
        .set('Cookie', studentCookie);

      expect(toggleRes.status).toBe(200);
      const updatedM = toggleRes.body.data.milestones.find((m: any) => m.id === milestoneId);
      expect(updatedM.completed).toBe(true);
    });
  });

  describe('9. Group Learning', () => {
    it('allows creating a learning group', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/groups')
        .set('Cookie', studentCookie)
        .send({
          skillName: 'React',
          category: 'Web Development',
          name: 'CU React 19 Builders Club',
          description: 'Weekly collaborative peer group building modern web apps with React 19 and Tailwind CSS.',
          maxMembers: 20,
          mode: 'BOTH',
          languages: ['English', 'Hindi'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('CU React 19 Builders Club');
      groupId = res.body.data._id;
    });

    it('allows another peer to request joining the group', async () => {
      const res = await request(app)
        .post(`/api/v1/learn-teach/groups/${groupId}/join`)
        .set('Cookie', student2Cookie)
        .send({
          message: 'Hi, I want to collaborate and learn React 19 with the group.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PENDING');
    });
  });

  describe('10. Moderation & Reporting Foundation', () => {
    it('allows submitting a content report', async () => {
      const res = await request(app)
        .post('/api/v1/learn-teach/reports')
        .set('Cookie', studentCookie)
        .send({
          targetType: 'USER',
          targetId: student2Id,
          reason: 'Spam or irrelevant commercial requests',
          details: 'Repeated promotional messages sent.',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Report submitted');
    });
  });
});
