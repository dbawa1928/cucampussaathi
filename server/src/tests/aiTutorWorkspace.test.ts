import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import AdmZip from 'adm-zip';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { DocumentModel } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';
import { DocumentConversationModel } from '../models/DocumentConversation';
import { signAccessToken, ACCESS_TOKEN_COOKIE } from '../utils/token';
import { hashPassword } from '../utils/password';
import { groqService } from '../services/groqService';

const app = createApp();

describe('AI Tutor Workspace: Multi-Format Extraction, Learning Tools & Content Viewer', () => {
  let studentCookie: string;
  let studentId: string;
  let pptxDocId: string;
  let docxDocId: string;

  beforeAll(async () => {
    await connectDatabase();
    const stamp = Date.now();

    // Mock Groq API
    vi.spyOn(groqService, 'generateLearningTool').mockImplementation(
      async (documentTitle, _chunks, toolType) => {
        return {
          answer: `## ${toolType.toUpperCase()} for ${documentTitle}\n\n- Key Concepts and high-yield questions with citations [Page 1].`,
          model: 'mocked-groq-model',
        };
      }
    );

    vi.spyOn(groqService, 'generateQuiz').mockImplementation(
      async (_documentTitle, _chunks, _numQuestions = 2) => {
        return {
          questions: [
            {
              id: 1,
              question: 'What is the primary objective of Boyce-Codd Normal Form (BCNF)?',
              options: [
                'Ensure every determinant is a candidate key',
                'Eliminate transitive dependencies',
                'Allow partial key dependencies',
                'None of the above',
              ],
              correctOptionIndex: 0,
              explanation: 'In BCNF, every functional dependency X -> Y requires X to be a superkey.',
              citationPage: 2,
            },
          ],
        };
      }
    );

    const passwordHash = await hashPassword('ValidPassword123!');
    const studentUser = await User.create({
      email: `tutor_student_${stamp}@cuchd.in`,
      passwordHash,
      fullName: 'Academic Student Tester',
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      isVerified: true,
      uid: `TUT_${stamp.toString().slice(-6)}`,
    });

    studentId = studentUser._id.toString();
    await StudentProfile.create({ user: studentUser._id, course: 'B.Tech CSE', semester: 6 });

    const token = signAccessToken({
      sub: studentId,
      email: studentUser.email,
      role: 'STUDENT',
      uid: studentUser.uid,
    });
    studentCookie = `${ACCESS_TOKEN_COOKIE}=${token}`;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /tutor_student_/ });
    await StudentProfile.deleteMany({ user: studentId });
    await DocumentModel.deleteMany({ owner: studentId });
    await DocumentChunkModel.deleteMany({ owner: studentId });
    await DocumentConversationModel.deleteMany({ owner: studentId });
    await disconnectDatabase();
  });

  it('rejects legacy binary .ppt files with clear guidance to export to .pptx or .pdf', async () => {
    const legacyPptHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00]);

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', [studentCookie])
      .attach('file', legacyPptHeader, 'Lecture1_Legacy.ppt');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Legacy PowerPoint (.ppt) binary format is not supported');
  });

  it('rejects legacy binary .doc files with clear guidance to export to .docx or .pdf', async () => {
    const legacyDocHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00]);

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', [studentCookie])
      .attach('file', legacyDocHeader, 'Assignment_Notes.doc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Legacy Word (.doc) binary format is not supported');
  });

  it('successfully uploads and indexes a PowerPoint (.pptx) presentation with slide-by-slide citations', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'ppt/slides/slide1.xml',
      Buffer.from(
        '<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Database Management Systems: Relational Normalization and 1NF, 2NF, 3NF Principles</a:t></p:sld>'
      )
    );
    zip.addFile(
      'ppt/slides/slide2.xml',
      Buffer.from(
        '<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Boyce-Codd Normal Form (BCNF) strictly requires every determinant to be a super key.</a:t></p:sld>'
      )
    );
    const pptxBuffer = zip.toBuffer();

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', [studentCookie])
      .attach('file', pptxBuffer, 'DBMS_Lecture_Slides.pptx');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document.documentFormat).toBe('pptx');
    expect(res.body.data.document.pageCount).toBe(2);
    expect(res.body.data.document.processingStatus).toBe('COMPLETED');
    pptxDocId = res.body.data.document._id;

    // Verify slide chunks exist
    const chunks = await DocumentChunkModel.find({ document: pptxDocId }).sort({ pageNumber: 1 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].content).toContain('Database Management Systems');
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[1].content).toContain('Boyce-Codd Normal Form');
  });

  it('successfully uploads and indexes a Microsoft Word (.docx) study guide', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'word/document.xml',
      Buffer.from(
        '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Operating Systems Architecture and CPU Scheduling. Round Robin and Priority scheduling prevent starvation.</w:t></w:r></w:p></w:body></w:document>'
      )
    );
    const docxBuffer = zip.toBuffer();

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', [studentCookie])
      .attach('file', docxBuffer, 'OS_Study_Notes.docx');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document.documentFormat).toBe('docx');
    expect(res.body.data.document.processingStatus).toBe('COMPLETED');
    docxDocId = res.body.data.document._id;
    expect(docxDocId).toBeDefined();
  });

  it('allows student to retrieve structured slide/page content for document viewer', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${pptxDocId}/content`)
      .set('Cookie', [studentCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document._id).toBe(pptxDocId);
    expect(res.body.data.pages.length).toBe(2);
    expect(res.body.data.pages[0].type).toBe('slide');
    expect(res.body.data.pages[0].pageNumber).toBe(1);
    expect(res.body.data.pages[0].text).toContain('Database Management Systems');
  });

  it('generates academic learning tools for uploaded material', async () => {
    const res = await request(app)
      .post(`/api/v1/ai/documents/${pptxDocId}/tools`)
      .set('Cookie', [studentCookie])
      .send({
        toolType: 'exam_prep',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.toolType).toBe('exam_prep');
    expect(res.body.data.content).toBeDefined();
    expect(res.body.data.content.length).toBeGreaterThan(20);
  });

  it('generates an interactive practice quiz with questions, options, and page citations', async () => {
    const res = await request(app)
      .post(`/api/v1/ai/documents/${pptxDocId}/quiz`)
      .set('Cookie', [studentCookie])
      .send({
        numQuestions: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.questions)).toBe(true);
    expect(res.body.data.questions.length).toBeGreaterThanOrEqual(1);

    const firstQuestion = res.body.data.questions[0];
    expect(firstQuestion.question).toBeDefined();
    expect(firstQuestion.options.length).toBeGreaterThanOrEqual(2);
    expect(typeof firstQuestion.correctOptionIndex).toBe('number');
  });
});
