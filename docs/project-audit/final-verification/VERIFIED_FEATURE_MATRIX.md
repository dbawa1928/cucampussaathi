# CUCampusSaathi — Verified Feature Matrix & Module Audit

**Generated Date**: October 31, 2026  
**Auditor**: Independent Principal Software Architect & QA Lead  
**Verification Method**: Static source code analysis, TypeScript compilation verification, route mapping, and schema inspection.

---

## 1. Feature Verification Standards

| Verification State | Criteria |
|:---|:---|
| **IMPLEMENTED & CODE VERIFIED** | Frontend component, backend route, controller, service layer, Mongoose model, and Zod validator exist and compile with zero errors. |
| **PARTIAL IMPLEMENTATION** | Functional core exists, but missing critical operational hooks (e.g. background cron execution or verification gates). |
| **UNVERIFIED LIVE** | Feature compiles, but cannot be proven functional in production due to reliance on external live services (SMTP, cloud storage) or lack of automated browser E2E tests. |
| **NOT IMPLEMENTED** | Capability requested in prompt or specifications but completely absent from the codebase. |

---

## 2. Module-by-Module Verification

### 2.1 Authentication & User Access

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Student Registration** | `RegisterPage.tsx`, `authController.ts`, `authService.ts`, `User.ts`, `StudentProfile.ts` | Validates `@cuchd.in` / approved institutional email domains. Hashes password using Argon2id. Creates user and profile. | **IMPLEMENTED & CODE VERIFIED** |
| **Teacher Registration** | `RegisterPage.tsx`, `authController.ts`, `authService.ts`, `TeacherProfile.ts` | Creates user with `role: 'TEACHER'` and `verificationStatus: 'PENDING'`. | **IMPLEMENTED & CODE VERIFIED** |
| **Admin Authentication** | `authController.ts`, `authGuard.ts` | Checks `req.user.role === 'ADMIN'`. Requires manual seeding or administrative role promotion. | **IMPLEMENTED & CODE VERIFIED** |
| **Login & Token Issuance** | `LoginPage.tsx`, `authController.ts`, `token.ts` | Issues 15-min access token and 7-day refresh token in HttpOnly cookies (`SameSite=Lax`). | **IMPLEMENTED & CODE VERIFIED** |
| **Refresh Token Rotation** | `authController.ts`, `RefreshToken.ts`, `token.ts` | Family rotation tracking implemented. Reuse of revoked tokens revokes entire token family. | **IMPLEMENTED & CODE VERIFIED** |
| **Password Hashing** | `password.ts`, `argon2` | Argon2id memory-hard hashing with secure salting. | **IMPLEMENTED & CODE VERIFIED** |
| **Forgot / Reset Password** | `ForgotPasswordPage.tsx`, `authService.ts`, `PasswordReset.ts` | SHA-256 hashed one-time reset tokens with 1-hour expiration. **Email dispatch falls back to mock logger when SMTP unset**. | **UNVERIFIED LIVE** |
| **Role-Based Guards** | `authGuard.ts`, `roleGuard` | Express middleware validates JWT and enforces role permissions (`STUDENT`, `TEACHER`, `ADMIN`). | **IMPLEMENTED & CODE VERIFIED** |
| **Suspended Account Gate** | `authGuard.ts` | Checks `user.accountStatus === 'SUSPENDED'` and rejects with 403 Forbidden. | **IMPLEMENTED & CODE VERIFIED** |
| **Teacher Verification Gate** | `availabilityService.ts`, `eventService.ts` | **DEFICIENCY FOUND**: `verificationStatus === 'VERIFIED'` is checked in Admin views, but **NOT enforced** when teachers create availability slots or publish events. Unverified teachers can currently post slots and events. | **PARTIAL IMPLEMENTATION** |

---

### 2.2 Student Management

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Student Onboarding** | `StudentOnboardingPage.tsx`, `profileController.ts`, `StudentProfile.ts` | 4-step wizard collecting UID, branch, semester, bio, and skills. Saves to `StudentProfile`. | **IMPLEMENTED & CODE VERIFIED** |
| **Profile Viewing & Editing** | `ProfilePage.tsx`, `profileService.ts` | Fetches current user and profile. Allows updating bio, skills, and academic details. | **IMPLEMENTED & CODE VERIFIED** |
| **Attendance Statistics** | `StudentProfile.ts`, `appointmentService.ts` | Tracks `totalAppointments`, `attendedAppointments`, `noShowAppointments`, and computes `attendanceRate`. | **IMPLEMENTED & CODE VERIFIED** |
| **Privacy Controls** | `ProfilePage.tsx`, `profileController.ts` | Allows toggling directory discoverability and email visibility. | **IMPLEMENTED & CODE VERIFIED** |

---

### 2.3 Teacher Management

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Teacher Profiles** | `ProfilePage.tsx`, `TeacherProfile.ts`, `profileService.ts` | Stores department, designation, cabin number, research domains, consultation hours. | **IMPLEMENTED & CODE VERIFIED** |
| **Single Slot Creation** | `AppointmentsPage.tsx`, `availabilityController.ts`, `AvailabilitySlot.ts` | Date, start/end time, capacity, and mode (`IN_PERSON` / `ONLINE`). Overlap detection implemented. | **IMPLEMENTED & CODE VERIFIED** |
| **Recurring Slot Generator**| `availabilityService.ts` | Generates weekly repeating slots over chosen horizon with collision checks. | **IMPLEMENTED & CODE VERIFIED** |
| **Slot Deletion** | `availabilityController.ts` | Deletes slot and warns if appointments exist. | **IMPLEMENTED & CODE VERIFIED** |
| **Teacher Restrictions** | `TeacherStudentRestriction.ts`, `teacherRestrictionService.ts` | Teachers can block specific students. Prevents restricted students from booking that teacher. | **IMPLEMENTED & CODE VERIFIED** |

---

### 2.4 FacultyConnect & Appointments

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Faculty Discovery** | `DirectoryPage.tsx`, `directoryController.ts` | Text search, department filters, pagination. Displays available slots. | **IMPLEMENTED & CODE VERIFIED** |
| **Appointment Booking** | `AppointmentsPage.tsx`, `appointmentService.ts`, `Appointment.ts` | Atomic booking check, restriction check, slot capacity decrement. | **IMPLEMENTED & CODE VERIFIED** |
| **Teacher Acceptance/Reject**| `AppointmentsPage.tsx`, `appointmentController.ts` | Teachers can accept (`PUT /:id/accept`) or reject with remarks. | **IMPLEMENTED & CODE VERIFIED** |
| **Appointment Cancellation**| `appointmentService.ts` | Restores slot capacity if cancelled prior to lead time. | **IMPLEMENTED & CODE VERIFIED** |
| **Rescheduling Negotiation**| `rescheduleController.ts`, `RescheduleProposal.ts` | Propose, accept, reject, or withdraw new consultation dates/times. | **IMPLEMENTED & CODE VERIFIED** |
| **Attendance Marking** | `appointmentController.ts`, `StudentProfile.ts` | Options: `ATTENDED`, `NO_SHOW`, `EXCUSED`. Automatically recalculates student attendance percentage. | **IMPLEMENTED & CODE VERIFIED** |
| **No-Show Appeals** | `appointmentService.ts` | Student can appeal no-show within 48 hours; teacher can review and accept/reject. | **IMPLEMENTED & CODE VERIFIED** |

---

### 2.5 Notification System

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Persistent Notifications**| `Notification.ts`, `notificationService.ts` | Saved in MongoDB with unread flags, action links, and contextual metadata. | **IMPLEMENTED & CODE VERIFIED** |
| **Unread Counter Badge** | `Navbar.tsx`, `notificationController.ts` | Real-time red badge showing active unread count (`GET /api/v1/notifications/unread-count`). | **IMPLEMENTED & CODE VERIFIED** |
| **Batch Read / Clear** | `notificationController.ts` | `PATCH /read-all` marks all user notifications as read. | **IMPLEMENTED & CODE VERIFIED** |
| **Socket.IO Real-Time Push**| `socket/index.ts`, `SocketContext.tsx` | Authenticates handshake, joins private room `user:${userId}`, pushes `new_notification` events. | **UNVERIFIED LIVE** |

---

### 2.6 AI Document Tutor

> [!IMPORTANT]
> **Definitive Retrieval Finding**: The AI Document Tutor uses **Okapi BM25 Lexical In-Memory Retrieval** over MongoDB chunks (`DocumentChunk`), filtered strictly by `{ owner: userId }`. It **does not** use dense vector embeddings, HNSW vector indexes, or an external vector database (Pinecone/Chroma/pgvector).

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Multi-Format Extraction** | `documentService.ts`, `documentProcessor.ts` | Supports PDF (`pdf-parse`), DOCX (`mammoth`), and PPTX (`adm-zip` XML parser). Max 25MB. | **IMPLEMENTED & CODE VERIFIED** |
| **Text Chunking Engine** | `documentProcessor.ts`, `DocumentChunk.ts` | Sliding window chunking (1000 tokens, 200 token overlap) with page/slide number attribution. | **IMPLEMENTED & CODE VERIFIED** |
| **Lexical Retrieval (BM25)**| `retrievalService.ts` | Computes token frequencies and BM25 scores in RAM for owner's chunks. | **IMPLEMENTED & CODE VERIFIED** |
| **Groq LLM Inference** | `aiTutorService.ts`, `groqService.ts` | Uses `groq-sdk` with `openai/gpt-oss-120b`. Generates structured answers with `[Page X]` citations. | **IMPLEMENTED & CODE VERIFIED** |
| **Multilingual Prompting** | `aiTutorService.ts` | Explicit system prompts instructing responses in English, Hindi (Devanagari), or Punjabi (Gurmukhi). | **IMPLEMENTED & CODE VERIFIED** |
| **Voice Input & Output** | `AiTutorPage.tsx` | Web Speech API (`webkitSpeechRecognition`) and `SpeechSynthesisUtterance` implemented in React. | **IMPLEMENTED & CODE VERIFIED** |
| **Integrated PDF Viewer** | `AiTutorPage.tsx`, `documentController.ts` | Streams file via `<iframe src="/api/v1/documents/:id/file#page=X" />`. | **IMPLEMENTED & CODE VERIFIED** |
| **Document File Storage** | `documentStorageService.ts` | **CRITICAL PRODUCTION BLOCKER**: Uploaded files are written to local disk `server/uploads/documents/`. On cloud platforms (Render), the container filesystem is ephemeral and wipes all files on restart. | **PARTIAL IMPLEMENTATION** |

---

### 2.7 Learn & Teach Network

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Skill Catalogue** | `ExploreSkillsPage.tsx`, `Skill.ts`, `learnTeachController.ts` | Categorized directory of academic and programming skills. | **IMPLEMENTED & CODE VERIFIED** |
| **Teaching Listings** | `MyTeachingSkillsPage.tsx`, `TeachingListing.ts` | Students post skills they can tutor with proficiency levels and availability. | **IMPLEMENTED & CODE VERIFIED** |
| **Learning Goals** | `MyLearningGoalsPage.tsx`, `LearningGoal.ts` | Target completion dates, progress percentages, milestone notes. | **IMPLEMENTED & CODE VERIFIED** |
| **Peer Discovery & Matches** | `DiscoverPeoplePage.tsx`, `RecommendationsPage.tsx` | Matching algorithm correlates user learning goals with peer teaching listings. | **IMPLEMENTED & CODE VERIFIED** |
| **Connection Lifecycle** | `ConnectionsPage.tsx`, `SkillConnection.ts` | Request, accept, reject, and complete peer tutoring relationships. | **IMPLEMENTED & CODE VERIFIED** |
| **Peer Messaging** | `ConnectionsPage.tsx`, `LearningMessage.ts` | 1-on-1 messaging between connected peers with Socket.IO real-time delivery. | **IMPLEMENTED & CODE VERIFIED** |
| **Collaborative Study Groups**| `LearningGroupsPage.tsx`, `LearningGroup.ts`, `GroupMembership.ts` | Topic-based study groups with member rosters and discussions. | **IMPLEMENTED & CODE VERIFIED** |
| **Reviews & Feedback** | `LearningSessionsPage.tsx`, `LearningReview.ts` | 1-to-5 star ratings and textual reviews of peer tutors. | **IMPLEMENTED & CODE VERIFIED** |
| **Abuse Reporting** | `LearnTeachReport.ts`, `learnTeachController.ts` | Flag abusive listings or chat messages; forwards to Admin queue. | **IMPLEMENTED & CODE VERIFIED** |

---

### 2.8 Campus Events Calendar

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Public Events Calendar** | `EventsCalendarPage.tsx`, `CampusEvent.ts`, `eventController.ts` | Month, week, and list views. Category filter pills and text search. | **IMPLEMENTED & CODE VERIFIED** |
| **Featured Events** | `EventsCalendarPage.tsx`, `CampusEvent.ts` | Highlights flagship campus hackathons and seminars. | **IMPLEMENTED & CODE VERIFIED** |
| **Event Creation & Drafts** | `ManageEventsPage.tsx`, `CampusEvent.ts` | Teachers create events with draft/published state, capacity, and deadlines. | **IMPLEMENTED & CODE VERIFIED** |
| **Student Registration** | `EventDetailPage.tsx`, `EventRegistration.ts` | Atomic registration check, capacity enforcement, duplicate prevention. | **IMPLEMENTED & CODE VERIFIED** |
| **Attendee Export (CSV)** | `ManageEventsPage.tsx`, `eventController.ts` | Generates CSV export of attendee roster with registration timestamps. | **IMPLEMENTED & CODE VERIFIED** |
| **Automated Reminders** | `eventService.ts` | **DEFICIENCY FOUND**: `processEventReminders` is implemented, but **no automated background cron or timer calls it**. Reminders are only triggered if an admin manually hits the endpoint. | **PARTIAL IMPLEMENTATION** |

---

### 2.9 Enterprise Admin Operations

| Feature / Subsystem | Implemented Files | Reality Check & Verification Evidence | Verified Status |
|:---|:---|:---|:---:|
| **Executive Overview** | `AdminDashboardPage.tsx`, `adminController.ts`, `adminService.ts` | High-level system metrics (users, appointments, system load, health). | **IMPLEMENTED & CODE VERIFIED** |
| **Universal User Directory** | `AdminDashboardPage.tsx`, `adminController.ts` | Search across students and faculty; view and toggle account status. | **IMPLEMENTED & CODE VERIFIED** |
| **360 User Dossier Modal** | `AdminDashboardPage.tsx`, `adminService.ts` | Aggregates user profile, booking history, attendance rate, and audit trail. | **IMPLEMENTED & CODE VERIFIED** |
| **Faculty Verifications** | `AdminDashboardPage.tsx`, `adminService.ts` | Review pending teacher credentials; approve or reject with comments. | **IMPLEMENTED & CODE VERIFIED** |
| **Global Appointments** | `AdminDashboardPage.tsx`, `adminService.ts` | Monitor all university consultations; force-cancel violating bookings. | **IMPLEMENTED & CODE VERIFIED** |
| **Attendance & Appeals** | `AdminDashboardPage.tsx`, `adminService.ts` | View campus no-show rates; execute administrative appeal overrides. | **IMPLEMENTED & CODE VERIFIED** |
| **Moderation Queues** | `AdminDashboardPage.tsx`, `adminService.ts` | Review flagged Learn & Teach reports and campus events. | **IMPLEMENTED & CODE VERIFIED** |
| **Immutable Audit Logs** | `AdminDashboardPage.tsx`, `AdminAuditLog.ts` | Ledger recording administrative actor, IP, timestamp, and entity diffs. | **IMPLEMENTED & CODE VERIFIED** |
| **Platform Settings Engine** | `AdminDashboardPage.tsx`, `PlatformSetting.ts` | Configures maintenance mode, lead times, and allowed email domains. | **IMPLEMENTED & CODE VERIFIED** |

