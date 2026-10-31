# CUCampusSaathi — Deployment & Production Readiness Audit

**Generated Date**: October 31, 2026  
**Auditor**: Principal DevOps Engineer & Cloud Architect  
**Target Platform**: Render.com Web Service (Unified Express + Vite Architecture)  
**Database**: MongoDB Atlas Cluster (`cluster0.t80l7pc.mongodb.net`)  
**CDN & Static Hosting**: Integrated Express Static File Handler (`express.static`)

---

## 1. Hosting Architecture Overview

CUCampusSaathi is architected as an **All-in-One Full-Stack Express Monolith**:
1. In development, Vite runs on port `5173` and proxies `/api` requests to Express on port `5000`.
2. In production, `npm run build` compiles the React 19 application into `dist/`. The Express backend serves `dist/` as static assets and forwards any unmatched frontend route to `dist/index.html` (HTML5 history pushState support).
3. All API routes are mounted under `/api/v1/`.

```
                    +------------------------------------+
                    |       Render Cloud Service         |
                    |   (Node.js 24 + Express Server)    |
                    +------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
       +-------------------+                     +-------------------+
       | /api/v1/* Routes  |                     |  Static / Assets  |
       |  - Auth & Admin   |                     |  - React 19 SPA   |
       |  - Events & Tutor |                     |  - Tailwind v4    |
       |  - FacultyConnect |                     |  - Lucide Icons   |
       +-------------------+                     +-------------------+
                 |                                         |
                 v                                         v
        [MongoDB Atlas & Groq]                       [Client Browser]
```

---

## 2. Environment Variables Inventory

> [!CAUTION]
> **Zero Secret Exposure Policy**: In accordance with security auditing guidelines, only variable names and functional descriptions are listed below. No secret keys, passwords, or connection URIs are displayed.

| Environment Variable Name | Required? | Default / Scope | Purpose & Description |
|:---|:---:|:---:|:---|
| `PORT` | Optional | `5000` | Port on which Express server listens (assigned automatically by Render). |
| `NODE_ENV` | **Required** | `production` | Enables Express production optimizations and secure cookie flags. |
| `CLIENT_ORIGIN` | **Required** | Production URL | Strict origin URL for CORS policy and cookie exchange. |
| `MONGODB_URI` | **Required** | MongoDB Atlas | Connection string for MongoDB Atlas replica set. |
| `JWT_ACCESS_SECRET` | **Required** | High-entropy string | Cryptographic key used to sign and verify 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | **Required** | High-entropy string | Cryptographic key used to sign and verify 7-day refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Optional | `15m` | Lifetime of short-lived JWT access token. |
| `JWT_REFRESH_EXPIRES_IN`| Optional | `7d` | Lifetime of long-lived refresh token. |
| `SEED_DEFAULT_PASSWORD` | Optional | Development only | Initial password used when running administrative database seed scripts. |
| `GROQ_API_KEY` | **Required** | Cloud API Key | Authentication credential for Groq LLM inference in the AI Tutor. |
| `GROQ_MODEL` | Optional | `openai/gpt-oss-120b` | Target language model identifier on the Groq inference engine. |
| `RAG_CHUNK_SIZE` | Optional | `1000` | Target token length for document text segmentation sliding windows. |
| `RAG_CHUNK_OVERLAP` | Optional | `200` | Sliding window character/token overlap for contextual continuity. |
| `MAX_DOCUMENT_SIZE_MB` | Optional | `25` | Hard limit on file upload size for academic PDF/DOCX/PPTX processing. |
| `DOCUMENTS_STORAGE_PATH`| Optional | `server/uploads/` | Filesystem path for locally staged academic documents. |
| `SMTP_HOST` | **Required** | e.g. `smtp.gmail.com` | Hostname of mail server for transactional email delivery. |
| `SMTP_PORT` | **Required** | `587` / `465` | TLS/STARTTLS port for outgoing email communication. |
| `SMTP_USER` | **Required** | Mail account | SMTP username for Nodemailer transport. |
| `SMTP_PASS` | **Required** | Mail app password | SMTP secret or application password for sending emails. |

---

## 3. Server Health & Monitoring Probes

The server exposes a standardized health probe for cloud platform monitoring:

- **Endpoint**: `GET /api/v1/health`
- **Authentication**: None (Public uptime probe)
- **Sample Response**:
  ```json
  {
    "status": "ok",
    "uptime": 14208.52,
    "timestamp": "2026-10-31T05:50:00.000Z",
    "version": "1.0.0"
  }
  ```
- **Platform Hook**: Configured as the Health Check Path in Render service settings to avoid downtime during rolling restarts.

---

## 4. Production Launch Readiness Checklist

| Readiness Category | Item Checked | Status | Remediation Required |
|:---|:---|:---:|:---|
| **Build & Compilation** | Frontend builds with 0 errors (`npm run build`) | **READY** | None. Tested and passed. |
| **Build & Compilation** | Backend builds with 0 errors (`npm --prefix server run build`) | **READY** | None. Tested and passed. |
| **Static Asset Delivery**| Express serves `dist/index.html` on root and deep routes | **READY** | Handled in `server/src/server.ts`. |
| **Database Connectivity**| Mongoose connects to MongoDB Atlas with auto-reconnect | **READY** | Handled in `database.ts`. |
| **Error Handling** | Global 500 error middleware catches uncaught exceptions | **READY** | `errorHandler.ts` formats clean JSON responses. |
| **Security Headers** | Helmet and CORS restricted to production origin | **READY** | Handled in `server.ts`. |
| **Persistence (Storage)**| Uploaded document files stored on disk | **ACTION NEEDED** | Render free/standard web instances have ephemeral disks. Move to S3/Cloudinary for long-term production file retention. |
| **Email Deliverability** | SMTP credentials configured on production server | **ACTION NEEDED** | Ensure `SMTP_USER` and `SMTP_PASS` are set in Render dashboard environment settings. |
| **Background Cron Jobs** | Daily automated event reminder dispatch worker | **ACTION NEEDED** | Set up a Render Cron Job or node-cron runner for `triggerEventReminders`. |

