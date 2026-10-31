# CUCampusSaathi — Remaining Work Roadmap & Engineering Action Plan

**Generated Date**: October 31, 2026  
**Auditor**: Principal Software Architect & Technical Lead  
**Scope**: Prioritized technical backlog for taking CUCampusSaathi from its current verified state to a resilient, high-scale university production launch.

---

## 1. Prioritized Work Breakdown Structure

### Priority 0: Critical Blockers for Production Launch (P0)

| ID | Task Name | Description & Impact | Dependencies | Complexity |
|:---:|:---|:---|:---|:---:|
| **P0-1** | **Cloud Object Storage (S3 / Cloudinary)** | Replace ephemeral local disk storage (`server/uploads/`) with AWS S3 or Cloudinary. On Render, local files are wiped on server restart or redeploy. | AWS SDK / Multer S3 | Medium |
| **P0-2** | **Production SMTP Provisioning** | Add verified credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) to Render environment to enable password reset and booking email delivery. | SendGrid / AWS SES / Gmail | Low |
| **P0-3** | **Automated Reminder Cron Worker** | Implement recurring cron worker (`node-cron` or Render Cron Job) calling `triggerEventReminders` 24h and 1h prior to campus events. | `eventService` | Low |
| **P0-4** | **Render Environment Variable Audit** | Verify that `CLIENT_ORIGIN` precisely matches the production domain (`https://cucampussaathi.onrender.com`) to allow cookie exchange. | Render Dashboard | Low |

---

### Priority 1: High-Priority Hardening & Scalability (P1)

| ID | Task Name | Description & Impact | Dependencies | Complexity |
|:---:|:---|:---|:---|:---:|
| **P1-1** | **Distributed Redis Rate Limiting** | Upgrade `express-rate-limit` from in-memory store to Redis (`rate-limit-redis`) to share rate limits across multiple horizontally scaled instances. | Redis / Upstash | Medium |
| **P1-2** | **GitHub Actions CI/CD Pipeline** | Create `.github/workflows/ci.yml` that runs `npm run build`, `npm --prefix server run build`, and Vitest test suite on every pull request. | GitHub Actions | Low |
| **P1-3** | **Playwright End-to-End Test Suite** | Implement 5 core browser E2E test journeys: Student Registration, Teacher Slot Creation, Appointment Booking & Acceptance, and Event Registration. | Playwright | Medium |
| **P1-4** | **MongoDB Index Optimization & Profiling** | Run explain plans on heavy queries (`/api/v1/directory`, `/api/v1/events`, `/api/v1/learn-teach/peers/explore`) to ensure index coverage. | MongoDB Atlas | Low |

---

### Priority 2: Medium-Priority Architectural Enhancements (P2)

| ID | Task Name | Description & Impact | Dependencies | Complexity |
|:---:|:---|:---|:---|:---:|
| **P2-1** | **Dense Vector Search Hybrid Option** | Introduce vector embeddings (e.g. OpenAI or open-source embeddings via MongoDB Atlas Vector Search) alongside the existing Okapi BM25 engine for hybrid retrieval. | Atlas Vector Search | High |
| **P2-2** | **Calendar Export (.ICS Download)** | Add "Add to Google Calendar / Outlook" and `.ics` file download buttons on confirmed appointments and event registration tickets. | `ics` library | Low |
| **P2-3** | **Bulk Email Dispatch Queue** | Implement BullMQ with Redis to process large-volume event announcements asynchronously without blocking the Express event loop. | BullMQ / Redis | Medium |
| **P2-4** | **WebSocket Connection Auto-Reconnect UX**| Display a subtle "Reconnecting to live notifications..." toast in the frontend if the Socket.IO socket disconnects temporarily. | `SocketContext.tsx` | Low |

---

### Priority 3: Low-Priority Polish & Future Horizons (P3)

| ID | Task Name | Description & Impact | Dependencies | Complexity |
|:---:|:---|:---|:---|:---:|
| **P3-1** | **PWA Mobile Shell & Offline Support** | Configure a service worker and web manifest for offline cached timetable viewing and PWA installation on mobile devices. | Vite PWA Plugin | Low |
| **P3-2** | **Faculty QR Attendance Scanner** | Provide teachers with an in-app camera barcode/QR scanner to instantly mark student attendance from student digital appointment passes. | `html5-qrcode` | Medium |
| **P3-3** | **Dark Mode Deep Contrast Polish** | Complete full dark-theme token coverage across all admin data tables and PDF preview overlays. | Tailwind CSS v4 | Low |

---

## 2. Top 10 Recommended Next Actions

1. **Configure Object Storage for Uploads**: Migrate from local disk to S3-compatible storage so student documents persist across server redeployments.
2. **Verify Render Environment Variables**: Confirm `CLIENT_ORIGIN`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GROQ_API_KEY`, and `SMTP_*` are loaded on Render.
3. **Mount Scheduled Event Reminders**: Add a 15-minute cron job to dispatch scheduled notifications for upcoming campus events and faculty appointments.
4. **Deploy GitHub Actions CI**: Automate linting, TypeScript compilation, and Vitest test runs on every repository commit.
5. **Attach Redis to Rate Limiter**: Prevent memory-leak risks and multi-dyno discrepancies by backing the rate limiter with a managed Redis instance.
6. **Implement 3 Playwright Smoke Tests**: Automate browser verification for user login, appointment booking, and event registration.
7. **Conduct Load Testing with k6**: Benchmark server responsiveness under concurrent traffic for campus event registrations.
8. **Add Calendar .ICS Generation**: Allow students to export confirmed bookings directly to Apple Calendar, Outlook, and Google Calendar.
9. **Refine Error Logging & Sentry Monitoring**: Integrate Sentry or Datadog for real-time frontend and backend exception tracking.
10. **Enable Hybrid Search in AI Tutor**: Evaluate adding MongoDB Atlas Vector Search alongside the existing Okapi BM25 engine for semantic concept matching.

