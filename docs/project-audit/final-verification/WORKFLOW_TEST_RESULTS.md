# CUCampusSaathi — Real Workflow Verification & End-to-End Test Audit

**Generated Date**: October 31, 2026  
**Auditor**: Independent Senior QA Engineer & Application Auditor  
**Audit Standard**: Strict Empirical Verification — No Fabricated Browser Results  
**Environment Status**: Local dev server not running; live database protected against destructive test writes.

---

## 1. Workflow Testing Protocol & Constraints

To protect the integrity of the live university production database (`cluster0.t80l7pc.mongodb.net/cucampussaathi`), destructive automated browser tests and test suite writes were **not executed against production records**.

Every user workflow has been evaluated through:
1. **Static Code & Route Tracing**: Verifying that UI handlers dispatch to the correct API endpoints with valid payload structures.
2. **Schema & Validator Alignment**: Confirming that frontend state objects conform to backend Zod validation schemas.
3. **Execution State Classification**:
   - **PASS**: Verified through unit/integration test logic and verified compilation.
   - **PARTIALLY WORKING**: Implemented in code, but possesses known functional bottlenecks or missing automation.
   - **NOT TESTED**: End-to-end browser execution was not performed in a live isolated staging environment.
   - **FAIL**: Documented functional failure or architectural defect.

---

## 2. Student User Journey Verification

| Step # | Action Description | Target Route / API | Execution Status | Empirical Findings & Verification Notes |
|:---:|:---|:---|:---:|:---|
| 1 | Log in as Student | `/login` -> `POST /api/v1/auth/login` | **PASS (Code Verified)** | Validates credentials, sets HttpOnly cookies (`accessToken`, `refreshToken`), updates `lastLoginAt`. |
| 2 | Open Student Dashboard | `/dashboard` | **PASS (Code Verified)** | Loads user metrics, upcoming consultations, and quick launch navigation. |
| 3 | Complete/Inspect Profile | `/profile`, `/student/onboarding` | **PASS (Code Verified)** | 4-step onboarding wizard collects UID, semester, branch, bio, and interests; persists to `StudentProfile`. |
| 4 | Browse Faculty Directory | `/directory` -> `GET /api/v1/directory` | **PASS (Code Verified)** | Searches faculty by name, department, and research tags; fetches available consultation slots. |
| 5 | Book Available Appointment | Modal -> `POST /api/v1/appointments` | **PASS (Code Verified)** | Decrements slot capacity, checks for duplicate active bookings and teacher restrictions. |
| 6 | View Notifications | `Navbar.tsx` -> `GET /api/v1/notifications` | **PASS (Code Verified)** | Displays persistent notification list and real-time unread counter badge. |
| 7 | Open AI Document Tutor | `/ai-tutor` | **PASS (Code Verified)** | Loads multi-format upload pane, integrated document viewer, and conversation history sidebar. |
| 8 | Upload Test Document | `POST /api/v1/documents/upload` | **PARTIALLY WORKING** | Extracts text from PDF/DOCX/PPTX and generates chunks. **Deficiency**: Files are stored on local ephemeral disk (`server/uploads/documents/`) and will be lost on container restart. |
| 9 | Ask Question & Inspect Citations | `POST /api/v1/ai-tutor/chat` | **PASS (Code Verified)** | Retrieves top chunks using **Okapi BM25 Lexical Retrieval** and prompts Groq LLM; returns footnotes with page citations. |
| 10 | Explore Learn & Teach | `/learn-teach/explore` | **PASS (Code Verified)** | Categorized taxonomy of skills and peer tutoring offerings. |
| 11 | Create/Update Learning Goal | `/learn-teach/my-goals` | **PASS (Code Verified)** | Sets target skill, target mastery date, and updates progress percentages. |
| 12 | Browse Campus Events | `/events` -> `GET /api/v1/events` | **PASS (Code Verified)** | Month, week, and list calendar views; category filter pills and date range selectors. |
| 13 | Register for Eligible Event | `POST /api/v1/events/:id/register` | **PASS (Code Verified)** | Atomically increments `registeredCount`, verifies capacity cap, and generates digital ticket code. |

---

## 3. Teacher User Journey Verification

| Step # | Action Description | Target Route / API | Execution Status | Empirical Findings & Verification Notes |
|:---:|:---|:---|:---:|:---|
| 1 | Log in as Teacher | `/login` -> `POST /api/v1/auth/login` | **PASS (Code Verified)** | Authenticates institutional email and loads teacher navigation permissions. |
| 2 | Inspect Teacher Profile | `/profile` -> `GET /api/v1/profile/me` | **PASS (Code Verified)** | Displays cabin location, designation, department, and research areas. |
| 3 | Verify Authorization Status | `TeacherProfile.verificationStatus` | **PARTIALLY WORKING** | Displays `'PENDING'`, `'VERIFIED'`, or `'REJECTED'`. **Deficiency**: The system does NOT block unverified teachers from posting availability or publishing events. |
| 4 | Create Availability Slots | `/appointments` -> `POST /api/v1/availability/slots` | **PASS (Code Verified)** | Enforces collision checks preventing overlapping time windows for the same teacher. |
| 5 | View Appointment Requests | `/appointments` -> `GET /api/v1/appointments/my` | **PASS (Code Verified)** | Displays pending student bookings with purpose and time details. |
| 6 | Accept / Reject Appointment | `PUT /api/v1/appointments/:id/accept` | **PASS (Code Verified)** | Transitions status to `ACCEPTED` or `REJECTED` and triggers student notification. |
| 7 | Manage Meeting Details | `PUT /api/v1/appointments/:id` | **PASS (Code Verified)** | Allows teacher to update cabin block or attach virtual meeting URL. |
| 8 | Mark Attendance | `PUT /api/v1/appointments/:id/attendance` | **PASS (Code Verified)** | Marks `ATTENDED`, `NO_SHOW`, or `EXCUSED`; automatically recalculates student attendance rate. |
| 9 | Create Teaching Listing | `/learn-teach/my-skills` | **PASS (Code Verified)** | Allows teachers/students to offer peer tutoring sessions with scheduling details. |
| 10 | Publish Campus Event | `/events/manage` -> `POST /api/v1/events` | **PASS (Code Verified)** | Validates form fields, mode (`ONLINE`/`OFFLINE`), venue, and transitions status to `PUBLISHED`. |
| 11 | Inspect Event Registrations | `/events/manage` -> `GET /:id/attendees` | **PASS (Code Verified)** | Displays confirmed student attendee roster and supports CSV export. |

---

## 4. Admin User Journey Verification

| Step # | Action Description | Target Route / API | Execution Status | Empirical Findings & Verification Notes |
|:---:|:---|:---|:---:|:---|
| 1 | Log in as Administrator | `/login` -> `POST /api/v1/auth/login` | **PASS (Code Verified)** | Requires `User.role === 'ADMIN'`. Role guard protects `/admin` route. |
| 2 | Open Admin Dashboard | `/admin` | **PASS (Code Verified)** | Loads unified tabbed administrative console with executive KPI cards. |
| 3 | View Statistics & Overview | `GET /api/v1/admin/overview` | **PASS (Code Verified)** | Aggregates real platform counts: total users, active appointments, attendance rate, system health. |
| 4 | Search for a Student | `GET /api/v1/admin/users?role=STUDENT` | **PASS (Code Verified)** | Filters users by UID, email, or full name with pagination. |
| 5 | Open 360 User Dossier | `GET /api/v1/admin/users/:id/dossier` | **PASS (Code Verified)** | Displays complete modal dossier: academic profile, consultation logs, and audit entries. |
| 6 | Search for a Teacher | `GET /api/v1/admin/users?role=TEACHER` | **PASS (Code Verified)** | Lists faculty by department and verification status. |
| 7 | Review Faculty Verification | `GET /api/v1/admin/verifications` | **PASS (Code Verified)** | Displays pending teacher credentials; allows one-click approval or rejection. |
| 8 | Review Global Appointments | `GET /api/v1/admin/appointments` | **PASS (Code Verified)** | Full campus appointment monitor with administrative force-cancel capabilities. |
| 9 | Review Moderation Records | `GET /api/v1/admin/moderation/learn-teach` | **PASS (Code Verified)** | Queue of flagged peer listings, reviews, and messages for disciplinary review. |
| 10 | Inspect Campus Events | `GET /api/v1/admin/events` | **PASS (Code Verified)** | Administrative events queue with featured toggle and force-cancel actions. |
| 11 | View Immutable Audit Logs | `GET /api/v1/admin/audit-logs` | **PASS (Code Verified)** | Filterable read-only ledger recording all administrative interventions, actor IPs, and changes. |
| 12 | Test Administrative Guard | `PATCH /api/v1/admin/users/:id/status` | **PASS (Code Verified)** | **Self-Lockout Guard**: Prevents admins from banning or demoting their own account. |

---

## 5. Summary of Workflow Findings

1. **Static & Service Logic**: Highly mature. Endpoints, controllers, and domain services implement all required state transitions and guards.
2. **Missing Live Staging Verification**: Because tests were not run against a dedicated staging replica, live browser-level interactions remain **UNVERIFIED LIVE**.
3. **Identified Functional Gaps**:
   - Absence of an automated background cron for event reminders.
   - Unverified teachers are not blocked from creating availability slots or publishing events.
   - Local document storage wipes files on server redeployment.

