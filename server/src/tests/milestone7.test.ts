import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { DocumentModel } from '../models/Document';
import { DocumentChunkModel } from '../models/DocumentChunk';
import { DocumentConversationModel } from '../models/DocumentConversation';
import { ACCESS_TOKEN_COOKIE, signAccessToken } from '../utils/token';
import { hashPassword } from '../utils/password';
import { groqService } from '../services/groqService';
import { documentStorageService } from '../services/documentStorageService';

const app = createApp();

function createValidPdfBuffer(
  textContent = 'Chandigarh University Artificial Intelligence Course Notes. RAG architectures use vector search and language models.'
): Buffer {
  const contentStream = `BT /F1 12 Tf 50 700 Td (${textContent}) Tj ET`;
  const streamLength = Buffer.byteLength(contentStream);
  const pdfString = [
    '%PDF-1.4',
    '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj',
    '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj',
    '3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>> endobj',
    '4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj',
    `5 0 obj <</Length ${streamLength}>> stream\n${contentStream}\nendstream endobj`,
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000244 00000 n ',
    '0000000318 00000 n ',
    'trailer <</Size 6 /Root 1 0 R>>',
    'startxref',
    '410',
    '%%EOF',
  ].join('\n');
  return Buffer.from(pdfString);
}

describe('Milestone 7: AI Document Tutor (RAG) — Integration Tests', () => {
  const timestamp = Date.now();

  let studentAId: string;
  let studentACookie: string;

  let studentBId: string;
  let studentBCookie: string;

  let adminId: string;
  let adminCookie: string;

  let uploadedDocAId: string;
  let uploadedDocBId: string;

  // Mock Groq AI completion to ensure fast, zero-quota automated test suite
  beforeAll(async () => {
    await connectDatabase();

    vi.spyOn(groqService, 'generateAnswer').mockImplementation(
      async (question, chunks, documentTitle) => {
        if (question.toLowerCase().includes('quantum teleportation') || question.toLowerCase().includes('cooking recipe')) {
          return {
            answer: 'The supplied document context does not contain enough information to answer this question. The topic is not available in the uploaded material.',
            model: 'mocked-groq-model',
          };
        }

        const pages = chunks.map((c) => c.pageNumber).join(', ');
        return {
          answer: `Based on "${documentTitle}" (Page ${pages || 1}), Artificial Intelligence and RAG pipelines retrieve document chunks before generating grounded answers.`,
          model: 'mocked-groq-model',
          promptTokens: 120,
          completionTokens: 45,
          totalTokens: 165,
        };
      }
    );

    vi.spyOn(groqService, 'generateSummary').mockImplementation(
      async (documentTitle, _chunks, summaryType) => {
        return {
          answer: `Summary of "${documentTitle}" (${summaryType}): Core concepts cover university level computing and retrieval-augmented generation.`,
          model: 'mocked-groq-model',
        };
      }
    );

    // 1. Create Student A
    const passwordHash = await hashPassword('StudentPass123!@#');
    const studentA = await User.create({
      fullName: 'Milestone7 Student Alpha',
      email: `m7_student_a_${timestamp}@cuchd.in`,
      uid: `M7A_${timestamp}`.slice(0, 15),
      passwordHash,
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      isVerified: true,
    });
    studentAId = studentA._id.toString();
    await StudentProfile.create({ user: studentA._id, course: 'B.Tech CSE', semester: 6 });
    studentACookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: studentAId,
      email: studentA.email,
      role: 'STUDENT',
      uid: studentA.uid,
    })}`;

    // 2. Create Student B (For cross-ownership isolation tests)
    const studentB = await User.create({
      fullName: 'Milestone7 Student Beta',
      email: `m7_student_b_${timestamp}@cuchd.in`,
      uid: `M7B_${timestamp}`.slice(0, 15),
      passwordHash,
      role: 'STUDENT',
      department: 'Electronics & Communication',
      isVerified: true,
    });
    studentBId = studentB._id.toString();
    await StudentProfile.create({ user: studentB._id, course: 'B.Tech ECE', semester: 4 });
    studentBCookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: studentBId,
      email: studentB.email,
      role: 'STUDENT',
      uid: studentB.uid,
    })}`;

    // 3. Create Admin
    const admin = await User.create({
      fullName: 'Milestone7 Admin Officer',
      email: `m7_admin_${timestamp}@cuchd.in`,
      uid: `M7ADM_${timestamp}`.slice(0, 15),
      passwordHash,
      role: 'ADMIN',
      department: 'Academic Administration',
      isVerified: true,
    });
    adminId = admin._id.toString();
    adminCookie = `${ACCESS_TOKEN_COOKIE}=${signAccessToken({
      sub: adminId,
      email: admin.email,
      role: 'ADMIN',
      uid: admin.uid,
    })}`;
  });

  afterAll(async () => {
    // Cleanup users, documents, chunks, and conversations created during test
    if (studentAId) {
      await User.findByIdAndDelete(studentAId);
      await StudentProfile.deleteMany({ user: studentAId });
    }
    if (studentBId) {
      await User.findByIdAndDelete(studentBId);
      await StudentProfile.deleteMany({ user: studentBId });
    }
    if (adminId) {
      await User.findByIdAndDelete(adminId);
    }
    if (uploadedDocAId) {
      const doc = await DocumentModel.findById(uploadedDocAId);
      if (doc) await documentStorageService.deleteFile(doc.storagePath);
      await DocumentModel.findByIdAndDelete(uploadedDocAId);
      await DocumentChunkModel.deleteMany({ document: uploadedDocAId });
      await DocumentConversationModel.deleteMany({ document: uploadedDocAId });
    }
    if (uploadedDocBId) {
      const doc = await DocumentModel.findById(uploadedDocBId);
      if (doc) await documentStorageService.deleteFile(doc.storagePath);
      await DocumentModel.findByIdAndDelete(uploadedDocBId);
      await DocumentChunkModel.deleteMany({ document: uploadedDocBId });
      await DocumentConversationModel.deleteMany({ document: uploadedDocBId });
    }
    vi.restoreAllMocks();
  });

  // ==========================================
  // SUITE 1: DOCUMENT UPLOAD & VALIDATION
  // ==========================================
  describe('1. Document Upload & Processing', () => {
    it('should reject unauthenticated upload with 401', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .attach('file', createValidPdfBuffer(), 'syllabus.pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-PDF file upload with 400', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Cookie', studentACookie)
        .attach('file', Buffer.from('Plain text notes not PDF'), 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject corrupted PDF without %PDF- magic bytes signature with 400', async () => {
      const fakePdfBuffer = Buffer.from('NOT_A_REAL_PDF_MAGIC_BYTES_CORRUPTED');
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Cookie', studentACookie)
        .attach('file', fakePdfBuffer, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/signature|corrupted/i);
    });

    it('should successfully upload, extract pages, and index valid PDF', async () => {
      const pdfBuffer = createValidPdfBuffer(
        'Chandigarh University Computer Science. Unit 1: Principles of Operating Systems, Memory Management, and Page Tables.'
      );

      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Cookie', studentACookie)
        .field('title', 'OS Unit 1 Study Guide')
        .attach('file', pdfBuffer, 'os_unit1.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document).toBeDefined();

      const doc = res.body.data.document;
      uploadedDocAId = doc._id;

      expect(doc.title).toBe('OS Unit 1 Study Guide');
      expect(doc.processingStatus).toBe('COMPLETED');
      expect(doc.pageCount).toBeGreaterThanOrEqual(1);
      expect(doc.chunkCount).toBeGreaterThanOrEqual(1);
      expect(doc.embeddingProvider).toBe('bm25-lexical');

      // Verify chunks were created in database
      const chunks = await DocumentChunkModel.find({ document: doc._id });
      expect(chunks.length).toBe(doc.chunkCount);
      expect(chunks[0].pageNumber).toBe(1);
      expect(chunks[0].content).toContain('Operating Systems');
    });

    it('should upload second document for Student B for isolation testing', async () => {
      const pdfBuffer = createValidPdfBuffer(
        'Digital Signal Processing notes for ECE students. Discrete Fourier Transform and Filtering.'
      );

      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Cookie', studentBCookie)
        .field('title', 'DSP Lecture Handout')
        .attach('file', pdfBuffer, 'dsp_notes.pdf');

      expect(res.status).toBe(201);
      uploadedDocBId = res.body.data.document._id;
      expect(uploadedDocBId).toBeDefined();
    });
  });

  // ==========================================
  // SUITE 2: DOCUMENT RETRIEVAL & OWNERSHIP
  // ==========================================
  describe('2. Document Ownership & Security Isolation', () => {
    it("should allow Student A to view their own uploaded document list", async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documents).toBeInstanceOf(Array);
      const docIds = res.body.data.documents.map((d: any) => d._id);
      expect(docIds).toContain(uploadedDocAId);
      expect(docIds).not.toContain(uploadedDocBId); // Must not leak Student B's document
    });

    it("should allow Student A to fetch their document details and status", async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${uploadedDocAId}`)
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.document.title).toBe('OS Unit 1 Study Guide');

      const statusRes = await request(app)
        .get(`/api/v1/documents/${uploadedDocAId}/status`)
        .set('Cookie', studentACookie);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.processingStatus).toBe('COMPLETED');
    });

    it("should strictly forbid Student B from viewing Student A's document (403)", async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${uploadedDocAId}`)
        .set('Cookie', studentBCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should strictly forbid Student B from deleting Student A's document (403)", async () => {
      const res = await request(app)
        .delete(`/api/v1/documents/${uploadedDocAId}`)
        .set('Cookie', studentBCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify doc still exists
      const doc = await DocumentModel.findById(uploadedDocAId);
      expect(doc).not.toBeNull();
    });

    it("should stream PDF file for document owner", async () => {
      const res = await request(app)
        .get(`/api/v1/documents/${uploadedDocAId}/file`)
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  // ==========================================
  // SUITE 3: AI DOCUMENT TUTOR RAG CHAT
  // ==========================================
  describe('3. AI Document Tutor RAG Engine', () => {
    let activeConversationId: string;

    it('should reject questions with insufficient length with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/chat`)
        .set('Cookie', studentACookie)
        .send({ question: '?' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should forbid Student B from querying Student A's document with AI Tutor (403)", async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/chat`)
        .set('Cookie', studentBCookie)
        .send({ question: 'What is in this document?' });

      expect(res.status).toBe(403);
    });

    it('should generate grounded answer with page citations for Student A', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/chat`)
        .set('Cookie', studentACookie)
        .send({ question: 'Explain operating systems and memory management from the notes.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.answer).toBeDefined();
      expect(data.conversationId).toBeDefined();
      activeConversationId = data.conversationId;

      expect(data.retrievalMethod).toBe('bm25-lexical');
      expect(data.sourceReferences).toBeInstanceOf(Array);
      expect(data.sourceReferences.length).toBeGreaterThanOrEqual(1);
      expect(data.sourceReferences[0].pageNumber).toBe(1);
      expect(data.sourceReferences[0].excerpt).toBeDefined();
    });

    it('should support follow-up questions within the same conversation thread', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/chat`)
        .set('Cookie', studentACookie)
        .send({
          question: 'Can you give a brief summary of page tables?',
          conversationId: activeConversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.conversationId).toBe(activeConversationId);

      // Verify conversation has 4 messages (2 user, 2 assistant)
      const conv = await DocumentConversationModel.findById(activeConversationId);
      expect(conv?.messages.length).toBe(4);
      expect(conv?.messages[0].role).toBe('USER');
      expect(conv?.messages[1].role).toBe('ASSISTANT');
    });

    it('should return honest not-found response for unsupported questions', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/chat`)
        .set('Cookie', studentACookie)
        .send({
          question: 'What is the recipe for chocolate cake and quantum teleportation?',
          conversationId: activeConversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toMatch(/not contain enough information|not available/i);
    });
  });

  // ==========================================
  // SUITE 4: DOCUMENT SUMMARIZATION
  // ==========================================
  describe('4. Document Summarization Engine', () => {
    it('should generate grounded summary for student', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/summarize`)
        .set('Cookie', studentACookie)
        .send({ summaryType: 'key_concepts' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summaryType).toBe('key_concepts');
      expect(res.body.data.pageCount).toBe(1);
    });

    it('should reject summarize request from unauthorized user (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/documents/${uploadedDocAId}/summarize`)
        .set('Cookie', studentBCookie)
        .send({ summaryType: 'exam_notes' });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // SUITE 5: CONVERSATION HISTORY & CLEANUP
  // ==========================================
  describe('5. Conversation History & Cascading Cleanup', () => {
    let testConvId: string;

    it("should list student's conversations for a document", async () => {
      const res = await request(app)
        .get(`/api/v1/ai/documents/${uploadedDocAId}/conversations`)
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toBeInstanceOf(Array);
      expect(res.body.data.conversations.length).toBeGreaterThanOrEqual(1);
      testConvId = res.body.data.conversations[0]._id;
    });

    it("should prevent Student B from reading Student A's conversation history (404/403)", async () => {
      const res = await request(app)
        .get(`/api/v1/ai/conversations/${testConvId}`)
        .set('Cookie', studentBCookie);

      expect(res.status).toBe(404);
    });

    it("should delete conversation thread on request", async () => {
      const res = await request(app)
        .delete(`/api/v1/ai/conversations/${testConvId}`)
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await DocumentConversationModel.findById(testConvId);
      expect(check).toBeNull();
    });

    it('should cleanly delete document and perform full cascading cleanup of chunks and files', async () => {
      const res = await request(app)
        .delete(`/api/v1/documents/${uploadedDocAId}`)
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify document no longer exists
      const docCheck = await DocumentModel.findById(uploadedDocAId);
      expect(docCheck).toBeNull();

      // Verify chunks are deleted
      const chunksCheck = await DocumentChunkModel.find({ document: uploadedDocAId });
      expect(chunksCheck.length).toBe(0);

      // Querying deleted document returns 404
      const queryCheck = await request(app)
        .get(`/api/v1/documents/${uploadedDocAId}`)
        .set('Cookie', studentACookie);

      expect(queryCheck.status).toBe(404);
    });
  });

  // ==========================================
  // SUITE 6: ADMIN DOCUMENT REGISTRY & STATS
  // ==========================================
  describe('6. Admin Document Registry & Campus Analytics', () => {
    it('should allow Admin to view campus-wide document registry and storage metrics', async () => {
      const res = await request(app)
        .get('/api/v1/documents/admin/all')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documents).toBeInstanceOf(Array);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should forbid regular students from accessing admin document registry (403)', async () => {
      const res = await request(app)
        .get('/api/v1/documents/admin/all')
        .set('Cookie', studentACookie);

      expect(res.status).toBe(403);
    });
  });
});
