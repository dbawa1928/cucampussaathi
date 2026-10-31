# CUCampusSaathi — Critical Production Blockers & Architectural Gaps

**Generated Date**: October 31, 2026  
**Auditor**: Independent Cloud Architect & Senior DevOps Engineer  
**Audit Finding**: The platform is **NOT PRODUCTION READY** until the five blockers identified below are resolved.

---

## 1. Master List of Production Blockers

```
+-----------------------------------------------------------------------------------+
|                           CRITICAL PRODUCTION BLOCKERS                            |
+-----+-----------------------------------+----------+------------------------------+
| #   | Blocker Description               | Severity | Impact on University Users   |
+-----+-----------------------------------+----------+------------------------------+
| B-1 | Ephemeral Local Document Storage  | CRITICAL | All uploaded PDFs/slides are |
|     | (Render wipes uploads on restart) |          | permanently lost on deploy   |
+-----+-----------------------------------+----------+------------------------------+
| B-2 | Unverified Production SMTP Mailer | HIGH     | Password reset & booking     |
|     | (Operates in Mock / Log mode)     |          | emails never reach users     |
+-----+-----------------------------------+----------+------------------------------+
| B-3 | Missing Automated Event Reminder  | HIGH     | Reminders are never sent     |
|     | Background Cron Runner            |          | unless triggered manually    |
+-----+-----------------------------------+----------+------------------------------+
| B-4 | In-Memory Rate Limiting & No Rate | HIGH     | Potential abuse of Groq API; |
|     | Limit on AI Chat Endpoint         |          | multi-instance bypass        |
+-----+-----------------------------------+----------+------------------------------+
| B-5 | Zero Automated Database Backups   | CRITICAL | No disaster recovery or data |
|     | & Undocumented Recovery Runbook   |          | restoration guarantee        |
+-----+-----------------------------------+----------+------------------------------+
```

---

## 2. In-Depth Blocker Analysis

### Blocker B-1: Ephemeral Local Document Storage
- **Current Code Location**: `server/src/services/documentStorageService.ts`
- **Current Behavior**:
  Files are written to `path.resolve(process.cwd(), env.DOCUMENTS_STORAGE_PATH)` (i.e. `server/uploads/documents/`) using Node.js `fs.promises.writeFile`.
- **The Problem**:
  On PaaS environments like Render, Heroku, or standard Docker container runners, the local filesystem is ephemeral. Every git push, redeployment, or daily container sleep/restart recreates the container image, completely wiping the `uploads/documents/` folder.
- **Consequence**:
  Students who upload study materials will find that clicking "View Document" or downloading past documents returns a `404 Not Found` error after any deployment.
- **Required Solution**:
  Implement an S3-compatible cloud storage adapter (AWS S3, Google Cloud Storage, or Cloudinary) in `documentStorageService.ts`.

---

### Blocker B-2: Production SMTP Operating in Mock Mode
- **Current Code Location**: `server/src/services/emailService.ts`
- **Current Behavior**:
  ```typescript
  if (host && user && pass) {
    this.transporter = nodemailer.createTransport({ ... });
  } else {
    logger.info('[EMAIL] SMTP credentials not provided. Operating in safe MOCK/LOG mode.');
  }
  ```
- **The Problem**:
  In testing and development environments where `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are unset, Nodemailer operates in log-only mock mode.
- **Consequence**:
  In production, if valid SMTP credentials are not configured in Render environment settings, password recovery emails, appointment booking confirmation emails, and reschedule alerts will silently fail to send.
- **Required Solution**:
  Provision production transactional email credentials (e.g. SendGrid, Amazon SES, or Brevo) and verify end-to-end delivery in production.

---

### Blocker B-3: Missing Automated Event Reminder Cron Runner
- **Current Code Location**: `server/src/services/eventService.ts:596` (`processEventReminders`)
- **Current Behavior**:
  The reminder logic (`24H` and `1H` notifications) is fully coded in `eventService.processEventReminders()`. However, **it is never called automatically by any recurring scheduler**.
- **The Problem**:
  Inspection of `server/src/index.ts` and `server/src/server.ts` confirms that only `reminderService.startReminderScheduler()` (for 1-on-1 consultations) is invoked on startup. Event reminders have no `setInterval`, `node-cron`, or Render Cron Job attached.
- **Consequence**:
  Registered students will **never receive automated 24-hour or 1-hour reminders** for upcoming campus hackathons or workshops unless an administrator manually executes `POST /api/v1/events/:id/reminders`.
- **Required Solution**:
  Mount a recurring background job in `server/src/index.ts` calling `eventService.processEventReminders()` every 15 minutes.

---

### Blocker B-4: Rate Limiter Store & Unthrottled AI Chat
- **Current Code Location**: `server/src/middleware/rateLimiter.ts`, `server/src/routes/aiTutorRoutes.ts`
- **The Problem**:
  1. `rateLimiter.ts` uses the default memory store of `express-rate-limit`. In a multi-dyno or auto-scaled environment, each instance tracks its own hit count, rendering limits ineffective against distributed requests.
  2. The AI Tutor chat route (`POST /api/v1/ai-tutor/chat`) has **no rate limiter**.
- **Consequence**:
  A single user or bot can send thousands of requests to the Groq LLM API, quickly exhausting API credits and degrading server responsiveness.
- **Required Solution**:
  Attach Redis store (`rate-limit-redis`) to rate limiters and add a strict per-user rate limit on `/api/v1/ai-tutor/chat` (e.g., 10 prompts per minute).

---

### Blocker B-5: Zero Database Backup Automation
- **Current State**:
  Inspection of the repository confirms zero backup scripts, zero scheduled database export jobs, and no disaster recovery runbook.
- **The Problem**:
  While MongoDB Atlas may offer cloud snapshots depending on tier configuration, the application provides no programmatic or documented mechanism for periodic off-site backups or point-in-time recovery testing.
- **Consequence**:
  Accidental administrative data corruption or collection drops cannot be recovered without opening a support ticket with the cloud provider.
- **Required Solution**:
  Establish automated daily backup exports and document a step-by-step restore runbook in `docs/operations/disaster-recovery.md`.

