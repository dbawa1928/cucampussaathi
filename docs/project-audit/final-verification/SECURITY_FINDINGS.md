# CUCampusSaathi — Application Security & Threat Model Audit

**Generated Date**: October 31, 2026  
**Auditor**: Independent Application Security Auditor & Architect  
**Methodology**: Static Code Analysis, Middleware Inspection, Authorization Tracing, and Risk Scoring (CVSS v3.1 / OWASP ASVS)

---

## 1. Executive Summary of Security Findings

| Finding ID | Severity | Category | Vulnerability / Risk Title | State |
|:---:|:---:|:---|:---|:---:|
| **SEC-01** | **HIGH** | Denial of Service / Cost Spike | **Unthrottled Groq AI Chat Endpoint (`/api/v1/ai-tutor/chat`)** | **CONFIRMED** |
| **SEC-02** | **MEDIUM** | In-Memory Session / State | **Rate Limiter In-Memory Storage (Non-Distributed)** | **CONFIRMED** |
| **SEC-03** | **MEDIUM** | Authorization Bypass | **Missing Teacher Verification Enforcement on Slot & Event Creation** | **CONFIRMED** |
| **SEC-04** | **LOW** | Injection | **Potential CSV Formula Injection in Attendee & Report Exports** | **POTENTIAL** |
| **SEC-05** | **LOW** | Denial of Service | **Unrestricted Public Event Query Endpoint Scrape Risk** | **POTENTIAL** |
| **SEC-06** | **INFORMATIONAL** | Privacy / Architecture | **Okapi BM25 Lexical In-Memory Search Memory Footprint** | **OBSERVED** |

---

## 2. Detailed Vulnerability Analyses

### SEC-01: Unthrottled Groq AI Chat Endpoint (Severity: HIGH)
- **Affected Endpoint**: `POST /api/v1/ai-tutor/chat`
- **Component**: `aiTutorRoutes.ts`, `aiTutorController.ts`
- **Vulnerability Description**:
  The AI Chat endpoint queries Groq's cloud LLM API (`openai/gpt-oss-120b`). While `authGuard` requires authentication, there is **no rate limiter** mounted on this route. An authenticated student or compromised account can execute rapid automated POST requests in an infinite loop, exhausting API quota or incurring significant cloud billing costs.
- **Remediation**:
  Mount a strict user-based rate limiter (e.g., maximum 10 prompts per minute per authenticated user) using `express-rate-limit` with `keyGenerator: (req) => req.user?.id`.

---

### SEC-02: Rate Limiter In-Memory Store (Severity: MEDIUM)
- **Affected Endpoints**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/contact`
- **Component**: `server/src/middleware/rateLimiter.ts`
- **Vulnerability Description**:
  `authRateLimiter` uses the default memory store of `express-rate-limit`. If CUCampusSaathi is deployed across multiple container instances on Render or Kubernetes, the hit counts are not shared across nodes. An attacker can distribute brute-force attempts across instances, bypassing the 20-attempt threshold.
- **Remediation**:
  Configure a Redis-backed store (`rate-limit-redis`) connecting to a managed Redis instance (e.g. Upstash or Redis Cloud).

---

### SEC-03: Missing Teacher Verification Enforcement on Slot & Event Creation (Severity: MEDIUM)
- **Affected Endpoints**: `POST /api/v1/availability/slots`, `POST /api/v1/events`
- **Component**: `availabilityService.ts`, `eventService.ts`
- **Vulnerability Description**:
  While `TeacherProfile.verificationStatus` exists and is managed in the Admin Dashboard, neither `availabilityService.createSlot` nor `eventService.createEvent` checks if the teacher's profile is in `VERIFIED` status. A newly registered teacher account with `verificationStatus: 'PENDING'` or even `'REJECTED'` can immediately post consultation slots and publish campus events.
- **Remediation**:
  Add a `verifiedTeacherGuard` middleware or explicit check:
  ```typescript
  if (teacherProfile.verificationStatus !== 'VERIFIED') {
    throw new AppError('Only verified faculty may publish availability or campus events.', 403);
  }
  ```

---

### SEC-04: Potential CSV Formula Injection in Attendee & Report Exports (Severity: LOW)
- **Affected Endpoints**: `GET /api/v1/events/:id/attendees` (Export CSV), `GET /api/v1/admin/reports/export-csv`
- **Component**: `adminService.exportReportCsv`, `eventService.getEventAttendees`
- **Vulnerability Description**:
  If a student registers with a full name or student ID beginning with formula triggers (e.g., `=CMD|' /C calc'!A0`, `+`, `-`, `@`), opening the exported CSV in Microsoft Excel or Google Sheets could trigger formula execution on the administrator's computer.
- **Remediation**:
  Sanitize all exported string cells by prefixing any field starting with `=`, `+`, `-`, or `@` with a single apostrophe (`'`).

---

### SEC-05: Unrestricted Public Event Query Scrape Risk (Severity: LOW)
- **Affected Endpoint**: `GET /api/v1/events`
- **Component**: `eventRoutes.ts`
- **Vulnerability Description**:
  Public visitors can query events without authentication. While this conforms to product requirements, lack of rate limiting allows aggressive web crawlers or scrapers to overwhelm the database.
- **Remediation**:
  Attach a public read rate limiter (e.g., 100 requests per 15 minutes per IP).

---

### SEC-06: Okapi BM25 Lexical In-Memory Search Memory Footprint (Severity: INFORMATIONAL)
- **Affected Component**: `retrievalService.ts`
- **Observation**:
  `retrievalService.retrieveRelevantChunks` fetches all chunks for a document from MongoDB into Node.js process memory to compute BM25 scores.
- **Risk Assessment**:
  For typical university lecture slides and documents under the 25MB limit, memory consumption remains manageable (a few megabytes). However, if an administrator raises `MAX_DOCUMENT_SIZE_MB` to 100MB+, concurrent queries could increase V8 heap pressure. The current 25MB limit is an appropriate safeguard.

---

## 3. Verified Security Controls & Defenses

1. **Argon2id Hashing**: Confirmed. Passwords are securely hashed with memory-hard parameters.
2. **HttpOnly Cookies**: Confirmed. `accessToken` and `refreshToken` are stored in browser-inaccessible cookies with `SameSite=Lax`.
3. **Token Rotation with Family Revocation**: Confirmed. Single-use refresh token mechanics invalidate the entire token family upon token reuse.
4. **Self-Lockout Prevention**: Confirmed. Admin endpoints prevent admins from demoting or banning their own accounts.
5. **Ownership Isolation (IDOR Defense)**: Confirmed. Document chunk queries enforce `{ owner: req.user.id }`; appointment and event cancellations verify creator ownership.
6. **Secret Hygiene**: Confirmed. Zero credentials, passwords, or connection strings are hardcoded in source files.

