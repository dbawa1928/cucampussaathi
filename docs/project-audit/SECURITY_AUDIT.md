# CUCampusSaathi — Application Security & Threat Model Audit

**Generated Date**: October 31, 2026  
**Auditor**: Senior Application Security Engineer & Principal Architect  
**Audit Standard**: OWASP ASVS 4.0 / OWASP Top 10 2021  
**Scope**: Frontend client security, Express middleware chain, authentication tokens, RBAC authorization, Mongoose query patterns, Groq AI boundaries, and infrastructure exposure.

---

## 1. Security Architecture Summary

```
                      +------------------------------------------+
                      |         Internet / Client Browser        |
                      +------------------------------------------+
                                           |
                                           | HTTPS / WSS
                                           v
                      +------------------------------------------+
                      |          Express Reverse Proxy           |
                      |  - Helmet (CSP, HSTS, Sniff Guard)       |
                      |  - CORS (Strict CLIENT_ORIGIN & Whitelist)|
                      |  - express-rate-limit (Auth & API Gates) |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Authentication Middleware          |
                      |  - Reads HttpOnly Cookie 'accessToken'   |
                      |  - Verifies JWT Signature (Argon2id auth)|
                      |  - Rejects Expired / Invalid Tokens      |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       RBAC Authorization Guard           |
                      |  - Checks req.user.role in [STUDENT,     |
                      |    TEACHER, ADMIN]                       |
                      |  - Self-Lockout Prevention Filter        |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |          Zod Input Validation            |
                      |  - Strips Undefined / Malicious Props    |
                      |  - Validates Email Regex & Enum Bounds   |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |    Service Layer (IDOR & Owner Guards)   |
                      |  - document.owner == req.user.id         |
                      |  - appointment.student/teacher == userId |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      MongoDB Atlas / Groq LLM API        |
                      |  - Mongoose Type Casting                 |
                      |  - BM25 In-Memory Chunk Security Filter  |
                      +------------------------------------------+
```

---

## 2. Deep-Dive Security Controls

### 2.1 Password Hashing & Credential Security
- **Algorithm**: `Argon2id` (via `argon2` v0.45.1).
- **Configuration**: Uses memory-hard parameters configured to resist GPU/ASIC rainbow table cracking and timing side-channel attacks.
- **Enforcement**: Plaintext passwords are never logged, stored in cache, or returned in query projections. Password hashing occurs immediately in `authService.register` and `authService.resetPassword`.

### 2.2 JWT Lifecycle & Refresh Rotation
- **Token Delivery**: Stored exclusively in secure, browser-inaccessible `HttpOnly` cookies (`SameSite=Lax`, `Secure=true` in production).
- **Access Token**: Short-lived (15 minutes).
- **Refresh Token**: Long-lived (7 days), stored in the `RefreshToken` collection with a unique `family` UUID.
- **Rotation Mechanics**: Every token refresh consumes the old refresh token and issues a new pair. If a previously consumed token is presented (reuse attack), the entire token family is revoked immediately, logging out all active sessions for that user.

### 2.3 Role-Based Access Control (RBAC) & IDOR Defenses
- **Middleware Implementation**: `authenticate` extracts and verifies the user identity; `authorize(['ADMIN'])` checks permissions before controller execution.
- **IDOR Protection**:
  - `documentService`: Queries always inject `{ owner: req.user.id }`.
  - `appointmentService`: Verifies that the acting user is either the assigned `student` or `teacher` before permitting cancellation, reschedule, or notes viewing.
  - `eventService`: Only the original creator (`organizer`) or an `ADMIN` can edit, cancel, or delete an event.
- **Self-Lockout Prevention**:
  - `adminController.updateUserStatus` and `adminController.updateUserRole` explicitly prevent an admin from modifying their own role or applying a `SUSPENDED` / `BANNED` status to themselves.

### 2.4 Injection & Input Sanitization
- **NoSQL Injection**: Express JSON parser combined with strict Mongoose schema models prevents operator injection (e.g. `{"$gt": ""}`). All user parameters in dynamic queries are cast through Mongoose schema types or Zod validators.
- **Schema Validation**: All mutating routes run incoming payloads through Zod schemas (`authValidators`, `appointmentValidators`, `eventValidators`, `learnTeachValidators`). Unknown keys are stripped (`strip`), and field lengths are constrained.
- **Cross-Site Scripting (XSS)**: React 19 inherently escapes dynamic content expressions. File downloads set appropriate MIME content headers to prevent HTML/SVG execution in the browser context.

### 2.5 Security Headers & Network Hygiene
- **Helmet**: Configures `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict transport security (`HSTS`).
- **CORS**: Configured with explicit `origin` matching `process.env.CLIENT_ORIGIN` and `credentials: true`.
- **Rate Limiting**: `express-rate-limit` is mounted on sensitive auth paths (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`) to mitigate credential stuffing and brute-force attacks.

---

## 3. Secret & Credential Exposure Audit

A comprehensive search of the codebase was conducted to identify any hardcoded credentials:

| Secret Type | Status | Evidence / Verification |
|:---|:---:|:---|
| MongoDB Connection Strings | **SECURE** | Loaded solely via `process.env.MONGODB_URI`. No hardcoded strings in source code. |
| JWT Access Secrets | **SECURE** | Read via `process.env.JWT_ACCESS_SECRET` with runtime startup validation. |
| JWT Refresh Secrets | **SECURE** | Read via `process.env.JWT_REFRESH_SECRET`. |
| Groq LLM API Keys | **SECURE** | Read via `process.env.GROQ_API_KEY`. |
| SMTP Passwords | **SECURE** | Read via `process.env.SMTP_PASS`. |
| Seed Passwords | **SECURE** | Controlled via `process.env.SEED_DEFAULT_PASSWORD`. |

---

## 4. Security Findings & Risk Classification

### Summary of Findings by Severity
- **Critical (P0)**: 0
- **High (P1)**: 0
- **Medium (P2)**: 2
- **Low (P3)**: 2
- **Informational**: 1

---

### Detailed Findings

#### Finding SEC-01 (Severity: MEDIUM) — Rate Limiter In-Memory Store
- **Description**: `express-rate-limit` is configured with default in-memory storage.
- **Impact**: If the application scales horizontally to multiple Render instances or dynos, rate limiting will not be shared across instances, allowing attackers to distribute attempts across nodes.
- **Recommendation**: Integrate a Redis store (`rate-limit-redis`) for distributed multi-instance deployments.

#### Finding SEC-02 (Severity: MEDIUM) — Local Disk File Storage for Documents
- **Description**: Uploaded documents (`PDF`, `DOCX`, `PPTX`) are stored in `server/uploads/documents/` on the local file system.
- **Impact**: On cloud PaaS providers like Render, the local disk is ephemeral and resets on each deployment or restart. Files will be lost unless persistent disks or cloud object storage is attached.
- **Recommendation**: Transition document storage to AWS S3, Google Cloud Storage, or Cloudinary.

#### Finding SEC-03 (Severity: LOW) — Password Reset Token Timing
- **Description**: Password reset tokens are stored as SHA-256 hashes in MongoDB with a 1-hour expiration.
- **Impact**: While securely hashed, an expired token cleanup relies on MongoDB TTL index sweeps, which run once every 60 seconds.
- **Recommendation**: Retain existing schema and explicitly verify token `expiresAt > new Date()` in memory during verification (already enforced in `authService.resetPassword`).

#### Finding SEC-04 (Severity: LOW) — Unauthenticated Event List Query
- **Description**: `GET /api/v1/events` is publicly accessible without login.
- **Impact**: Public users can read campus event listings. This is by design (Section 2 of requirements), but allows automated scraping of event titles and speakers.
- **Recommendation**: Maintain public access as designed, but attach basic rate limiting (e.g. 100 requests per 15 minutes) to the public event endpoint.

#### Finding SEC-05 (Severity: INFORMATIONAL) — BM25 Retrieval In-Memory Heap
- **Description**: Chunk tokenization and BM25 score calculations for large documents occur in Node.js process memory.
- **Impact**: Uploading extremely large textbooks could consume significant V8 heap memory.
- **Recommendation**: The 25MB file size limit (`MAX_DOCUMENT_SIZE_MB=25`) adequately mitigates this risk for normal university usage.

