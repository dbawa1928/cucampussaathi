# CUCampusSaathi — Actionable Engineering & Remediation Roadmap

**Generated Date**: October 31, 2026  
**Auditor**: Independent Principal Software Architect & DevOps Lead  
**Target Milestone**: Resolution of Critical Production Blockers & Staging Hardening

---

## 1. Prioritized Remediation Backlog

### Priority 0: Critical Before Launch (P0)

| ID | Task Name | Affected Module | Reason & Current Status | Dependencies | Acceptance Criteria |
|:---:|:---|:---|:---|:---|:---|
| **P0-1** | **Migrate Document Storage to Cloud Object Storage (S3 / Cloudinary)** | AI Document Tutor | **Status**: Local filesystem only (`server/uploads/documents/`).<br>**Reason**: On Render, local storage is wiped on every restart or deployment, causing 404s for student study documents. | AWS S3 SDK / Cloudinary | Documents persist across container restarts; upload and stream URLs work seamlessly. |
| **P0-2** | **Configure & Verify Production SMTP Mailer** | Authentication / Appointments | **Status**: Operates in Mock/Log mode.<br>**Reason**: Password reset tokens and appointment confirmation emails never reach actual users. | SendGrid / AWS SES / Gmail | Test user triggers password reset and receives email within 60 seconds. |
| **P0-3** | **Mount Automated Event Reminder Cron Scheduler** | Campus Events Calendar | **Status**: Logic exists in `eventService.processEventReminders()` but is never invoked automatically.<br>**Reason**: Registered students never receive 24h/1h notifications. | `node-cron` or Render Cron | Background worker runs every 15 minutes; dispatches reminders idempotently. |
| **P0-4** | **Enforce Teacher Verification Gate on Slots & Events** | Teacher Management / Availability | **Status**: Unverified teachers can create slots and publish events.<br>**Reason**: Security vulnerability allowing unvetted public accounts to pose as faculty. | `authGuard.ts`, `availabilityService.ts` | Endpoint returns `403 Forbidden` if `teacherProfile.verificationStatus !== 'VERIFIED'`. |
| **P0-5** | **Add Rate Limiter to AI Tutor Chat Endpoint** | AI Document Tutor | **Status**: Endpoint `/api/v1/ai-tutor/chat` has no rate limiter.<br>**Reason**: Malicious users or scripts can exhaust Groq LLM API quota and spike costs. | `rateLimiter.ts` | Authenticated users are capped at 10 AI chat requests per minute; returns 429 upon excess. |

---

### Priority 1: Required for Reliable Production Operation (P1)

| ID | Task Name | Affected Module | Reason & Current Status | Dependencies | Acceptance Criteria |
|:---:|:---|:---|:---|:---|:---|
| **P1-1** | **Isolate Test Suite with In-Memory Database** | Quality Assurance / Testing | **Status**: All 11 test suites target live production MongoDB Atlas.<br>**Reason**: Cannot run tests safely in CI or sandboxes without risking live data. | `mongodb-memory-server` | Running `npm test` connects to ephemeral in-memory MongoDB with zero external calls. |
| **P1-2** | **Implement Distributed Redis Rate Limiting** | Security / Middleware | **Status**: In-memory `express-rate-limit`.<br>**Reason**: Ineffective across multi-instance or auto-scaled container deployments. | Redis / Upstash | Rate limits are shared across multiple server processes. |
| **P1-3** | **Automated Browser E2E Test Suite (Playwright)** | Quality Assurance | **Status**: Zero browser-level test automation.<br>**Reason**: Need regression protection for student booking and event registration workflows. | Playwright | 5 automated browser flows pass on every pull request. |
| **P1-4** | **CSV Formula Injection Sanitization** | Admin Dashboard / Reports | **Status**: Raw text exported to CSV files.<br>**Reason**: Formulas like `=CMD()` could execute in spreadsheet software. | `adminService.ts`, `eventService.ts` | All exported string cells starting with `=`, `+`, `-`, `@` are prepended with an apostrophe. |

---

### Priority 2: Important Architectural Improvements (P2)

| ID | Task Name | Affected Module | Reason & Current Status | Dependencies | Acceptance Criteria |
|:---:|:---|:---|:---|:---|:---|
| **P2-1** | **Automate Daily MongoDB Atlas Backups & Document Runbook** | DevOps / Infrastructure | **Status**: No backup scripts or disaster recovery procedure.<br>**Reason**: Critical for enterprise data protection. | MongoDB Atlas CLI | Daily snapshots verified; disaster recovery runbook committed to `docs/operations/`. |
| **P2-2** | **Add Calendar (.ICS) Export for Appointments & Events** | FacultyConnect / Events | **Status**: In-app viewing only.<br>**Reason**: Enhances student experience by syncing with Google Calendar / Outlook. | `ics` library | One-click button downloads `.ics` file with correct UTC timestamps and location details. |
| **P2-3** | **Optional Vector Search Alongside BM25** | AI Document Tutor | **Status**: Pure Okapi BM25 keyword search.<br>**Reason**: Vector embeddings improve conceptual and semantic question-answering. | Atlas Vector Search | Hybrid retrieval blending BM25 lexical scores with vector embeddings. |

---

### Priority 3: Future Polish & Enhancements (P3)

| ID | Task Name | Affected Module | Reason & Current Status | Dependencies | Acceptance Criteria |
|:---:|:---|:---|:---|:---|:---|
| **P3-1** | **Progressive Web App (PWA) Offline Shell** | Frontend Architecture | **Status**: Standard SPA.<br>**Reason**: Faster mobile loading and cached campus timetable access. | `vite-plugin-pwa` | Web manifest and service worker cache static assets for offline use. |
| **P3-2** | **Faculty In-App QR Attendance Scanner** | FacultyConnect | **Status**: Manual dropdown attendance marking.<br>**Reason**: Simplifies large consultation session attendance tracking. | `html5-qrcode` | Faculty camera scans student QR code from appointment pass to mark attendance. |

---

## 2. Top 10 Most Critical Remaining Tasks

1. **Migrate Document Storage to AWS S3 / Cloudinary** (Resolves ephemeral container data loss).
2. **Provision Production SMTP Credentials & Test Real Delivery** (Enables password resets and booking alerts).
3. **Mount Automated Recurring Cron for Campus Event Reminders** (Enables 24h and 1h notifications).
4. **Enforce Verification Gate on Availability & Event Creation** (Blocks unverified faculty).
5. **Attach Strict Rate Limiter on `POST /api/v1/ai-tutor/chat`** (Prevents Groq LLM API exhaustion).
6. **Decouple Integration Tests with `mongodb-memory-server`** (Allows safe CI/CD testing without live Atlas writes).
7. **Switch Rate Limiting Store to Distributed Redis** (Supports multi-instance scaling).
8. **Sanitize CSV Exports Against Formula Injection** (Protects admin spreadsheet tools).
9. **Automate Daily Database Snapshots & Document Disaster Recovery** (Enterprise data assurance).
10. **Implement Core Playwright Browser Smoke Tests** (Verifies live user journeys).

