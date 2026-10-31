# CUCampusSaathi — Complete Database Schema & Mongoose Model Audit

**Generated Date**: October 31, 2026  
**Auditor**: Database Architect & Senior Backend Engineer  
**Database**: MongoDB Atlas (Connected via Mongoose 8.12.0)  
**Total Verified Models**: 31 Mongoose Models  
**Model Location**: `server/src/models/`

---

## 1. Schema Inventory Overview

| # | Model Name | Collection Name | Purpose & Business Domain | Key References |
|:---:|:---|:---|:---|:---|
| 1 | `User` | `users` | Primary identity, authentication credentials, role & status | Self |
| 2 | `StudentProfile` | `studentprofiles` | Academic branch, semester, UID, attendance percentage, bio | `User` |
| 3 | `TeacherProfile` | `teacherprofiles` | Department, designation, cabin location, verification status | `User` |
| 4 | `RefreshToken` | `refreshtokens` | JWT refresh token family tracking & revocation | `User` |
| 5 | `PasswordReset` | `passwordresets` | Cryptographic SHA-256 tokens for password recovery | `User` |
| 6 | `AvailabilitySlot` | `availabilityslots`| Teacher consultation slots (date, time, capacity, mode) | `User` (Teacher) |
| 7 | `Appointment` | `appointments` | Bookings between students & faculty with status lifecycle | `User` (Student, Teacher), `AvailabilitySlot` |
| 8 | `RescheduleProposal` | `rescheduleproposals` | Negotiation workflow for shifting appointment times | `Appointment`, `User` |
| 9 | `TeacherStudentRestriction` | `teacherstudentrestrictions` | Access barrier preventing booking from restricted students | `User` (Teacher, Student) |
| 10 | `Notification` | `notifications` | User alerts for bookings, cancellations, appeals, listings | `User` |
| 11 | `Document` | `documents` | Uploaded academic files (PDF, DOCX, PPTX) metadata | `User` |
| 12 | `DocumentChunk` | `documentchunks` | Text chunks with token indexes for in-memory BM25 retrieval | `Document`, `User` |
| 13 | `DocumentConversation`| `documentconversations` | AI multi-turn chat sessions and historical messages | `Document`, `User` |
| 14 | `Skill` | `skills` | Master taxonomy of academic and technical skills | None |
| 15 | `TeachingListing` | `teachinglistings` | Peer-to-peer student tutoring offerings and availability | `User`, `Skill` |
| 16 | `LearningGoal` | `learninggoals` | Student learning milestones and targeted completion dates | `User`, `Skill` |
| 17 | `SkillConnection` | `skillconnections` | Mentorship relationships connecting learners and tutors | `User` (Learner, Tutor), `Skill` |
| 18 | `LearningMessage` | `learningmessages` | 1-on-1 encrypted chat messages between peer connections | `SkillConnection`, `User` |
| 19 | `LearningSession` | `learningsessions` | Completed tutoring session logs with attendance duration | `SkillConnection`, `User` |
| 20 | `LearningReview` | `learningreviews` | 1-to-5 star ratings and textual peer reviews | `SkillConnection`, `User` |
| 21 | `LearningGroup` | `learninggroups` | Collaborative peer study circles and discussion groups | `User` (Creator) |
| 22 | `GroupMembership` | `groupmemberships` | User enrollment records within study groups | `LearningGroup`, `User` |
| 23 | `SkillProgress` | `skillprogresses` | Self-reported or assessed skill proficiency progress | `User`, `Skill` |
| 24 | `LearnTeachReport` | `learnteachreports` | Abuse and violation flags for peer moderation | `User` (Reporter, ReportedUser) |
| 25 | `CampusEvent` | `campusevents` | University workshops, hackathons, and cultural fests | `User` (Organizer) |
| 26 | `EventRegistration`| `eventregistrations` | Student registration tickets with unique ticket codes | `CampusEvent`, `User` |
| 27 | `EventReminderLog` | `eventreminderlogs` | Tracking automated reminder dispatch (24h/1h) | `CampusEvent`, `User` |
| 28 | `ContactMessage` | `contactmessages` | Public contact inquiry form submissions | None |
| 29 | `PlatformSetting` | `platformsettings` | Dynamic operational parameters and maintenance toggles | `User` (UpdatedBy) |
| 30 | `AdminAuditLog` | `adminauditlogs` | Immutable audit trail of administrative interventions | `User` (AdminActor) |
| 31 | `EmailLog` | `emaillogs` | Delivery receipts and failure records of transactional emails | `User` |

---

## 2. In-Depth Schema Specifications

### 2.1 Identity & Access Control Models

#### Model 1: `User` (`server/src/models/User.ts`)
- **Fields**:
  - `email`: String (Required, Unique, Lowercase, Indexed)
  - `passwordHash`: String (Required, Argon2id hash)
  - `role`: String (Enum: `['STUDENT', 'TEACHER', 'ADMIN']`, Default: `'STUDENT'`, Indexed)
  - `status`: String (Enum: `['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION']`, Default: `'ACTIVE'`)
  - `fullName`: String (Required, Trimmed)
  - `avatarUrl`: String (Optional)
  - `isEmailVerified`: Boolean (Default: false)
  - `lastLoginAt`: Date (Optional)
  - `timestamps`: `createdAt`, `updatedAt`
- **Indexes**: `{ email: 1 }` (Unique), `{ role: 1, status: 1 }`

#### Model 2: `StudentProfile` (`server/src/models/StudentProfile.ts`)
- **Fields**:
  - `user`: ObjectId -> `User` (Required, Unique, Indexed)
  - `uid`: String (Required, University Student UID, Trimmed)
  - `branch`: String (Required, e.g. `'CSE'`, `'IT'`, `'ECE'`)
  - `semester`: Number (Required, Min: 1, Max: 12)
  - `section`: String (Optional)
  - `bio`: String (Optional, Max 500 chars)
  - `skills`: `[String]` (Tags for interests)
  - `attendanceRate`: Number (Default: 100.0, Min: 0, Max: 100)
  - `totalAppointments`: Number (Default: 0)
  - `attendedAppointments`: Number (Default: 0)
  - `noShowAppointments`: Number (Default: 0)
  - `isProfileComplete`: Boolean (Default: false)
  - `isDiscoverable`: Boolean (Default: true)
  - `timestamps`: `createdAt`, `updatedAt`

#### Model 3: `TeacherProfile` (`server/src/models/TeacherProfile.ts`)
- **Fields**:
  - `user`: ObjectId -> `User` (Required, Unique, Indexed)
  - `department`: String (Required, Indexed)
  - `designation`: String (Required, e.g. `'Assistant Professor'`, `'HOD'`)
  - `cabinNumber`: String (Required, e.g. `'Block 3, Cabin 402'`)
  - `qualifications`: `[String]`
  - `researchAreas`: `[String]` (Indexed)
  - `biography`: String (Optional)
  - `verificationStatus`: String (Enum: `['PENDING', 'VERIFIED', 'REJECTED']`, Default: `'PENDING'`, Indexed)
  - `rejectionReason`: String (Optional)
  - `consultationHours`: String (Optional)
  - `maxDailyAppointments`: Number (Default: 10)
  - `timestamps`: `createdAt`, `updatedAt`

#### Model 4: `RefreshToken` (`server/src/models/RefreshToken.ts`)
- **Fields**:
  - `token`: String (Required, Unique, Indexed)
  - `user`: ObjectId -> `User` (Required, Indexed)
  - `family`: String (Required, Token family UUID for rotation detection)
  - `isRevoked`: Boolean (Default: false)
  - `expiresAt`: Date (Required, TTL index)
  - `deviceInfo`: String (Optional)
  - `ipAddress`: String (Optional)
  - `timestamps`: `createdAt`
- **Indexes**: `{ expiresAt: 1 }` (ExpireAfterSeconds: 0)

#### Model 5: `PasswordReset` (`server/src/models/PasswordReset.ts`)
- **Fields**:
  - `tokenHash`: String (Required, SHA-256 hash, Unique)
  - `user`: ObjectId -> `User` (Required, Indexed)
  - `expiresAt`: Date (Required, TTL index: 3600 seconds)
  - `isUsed`: Boolean (Default: false)
  - `timestamps`: `createdAt`

---

### 2.2 FacultyConnect Appointment Models

#### Model 6: `AvailabilitySlot` (`server/src/models/AvailabilitySlot.ts`)
- **Fields**:
  - `teacher`: ObjectId -> `User` (Required, Indexed)
  - `date`: String (Required, YYYY-MM-DD, Indexed)
  - `startTime`: String (Required, HH:MM 24h)
  - `endTime`: String (Required, HH:MM 24h)
  - `mode`: String (Enum: `['IN_PERSON', 'ONLINE']`, Default: `'IN_PERSON'`)
  - `location`: String (Optional cabin or meeting URL)
  - `maxCapacity`: Number (Default: 1, Min: 1)
  - `currentBookings`: Number (Default: 0)
  - `isCancelled`: Boolean (Default: false)
  - `timestamps`: `createdAt`, `updatedAt`
- **Compound Indexes**: `{ teacher: 1, date: 1, startTime: 1 }`

#### Model 7: `Appointment` (`server/src/models/Appointment.ts`)
- **Fields**:
  - `student`: ObjectId -> `User` (Required, Indexed)
  - `teacher`: ObjectId -> `User` (Required, Indexed)
  - `slot`: ObjectId -> `AvailabilitySlot` (Required, Indexed)
  - `date`: String (Required, YYYY-MM-DD)
  - `startTime`: String (Required)
  - `endTime`: String (Required)
  - `purpose`: String (Required, Max 500 chars)
  - `mode`: String (Enum: `['IN_PERSON', 'ONLINE']`)
  - `status`: String (Enum: `['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED']`, Default: `'PENDING'`, Indexed)
  - `attendance`: String (Enum: `['NOT_MARKED', 'ATTENDED', 'NO_SHOW', 'EXCUSED']`, Default: `'NOT_MARKED'`)
  - `attendanceMarkedAt`: Date (Optional)
  - `cancellationReason`: String (Optional)
  - `cancelledBy`: ObjectId -> `User` (Optional)
  - `appealStatus`: String (Enum: `['NONE', 'SUBMITTED', 'APPROVED', 'REJECTED']`, Default: `'NONE'`)
  - `appealReason`: String (Optional)
  - `appealRemarks`: String (Optional)
  - `timestamps`: `createdAt`, `updatedAt`
- **Compound Indexes**: `{ student: 1, status: 1 }`, `{ teacher: 1, status: 1 }`, `{ date: 1 }`

#### Model 8: `RescheduleProposal` (`server/src/models/RescheduleProposal.ts`)
- **Fields**:
  - `appointment`: ObjectId -> `Appointment` (Required, Indexed)
  - `proposedBy`: ObjectId -> `User` (Required)
  - `newSlot`: ObjectId -> `AvailabilitySlot` (Optional)
  - `newDate`: String (Required)
  - `newStartTime`: String (Required)
  - `newEndTime`: String (Required)
  - `reason`: String (Required)
  - `status`: String (Enum: `['PENDING', 'ACCEPTED', 'REJECTED']`, Default: `'PENDING'`)
  - `rejectionReason`: String (Optional)
  - `timestamps`: `createdAt`, `updatedAt`

#### Model 9: `TeacherStudentRestriction` (`server/src/models/TeacherStudentRestriction.ts`)
- **Fields**:
  - `teacher`: ObjectId -> `User` (Required, Indexed)
  - `student`: ObjectId -> `User` (Required, Indexed)
  - `reason`: String (Required)
  - `isActive`: Boolean (Default: true, Indexed)
  - `unblockedAt`: Date (Optional)
  - `unblockReason`: String (Optional)
  - `overriddenByAdmin`: ObjectId -> `User` (Optional)
  - `timestamps`: `createdAt`, `updatedAt`
- **Compound Indexes**: `{ teacher: 1, student: 1, isActive: 1 }`

#### Model 10: `Notification` (`server/src/models/Notification.ts`)
- **Fields**:
  - `recipient`: ObjectId -> `User` (Required, Indexed)
  - `title`: String (Required)
  - `message`: String (Required)
  - `type`: String (Enum: `['APPOINTMENT_REQUEST', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'RESCHEDULE_PROPOSED', 'ATTENDANCE_MARKED', 'APPEAL_DECISION', 'EVENT_REMINDER', 'LEARN_TEACH_MESSAGE', 'SYSTEM']`)
  - `isRead`: Boolean (Default: false, Indexed)
  - `link`: String (Optional URL action)
  - `metadata`: Schema.Types.Mixed (Optional contextual JSON)
  - `timestamps`: `createdAt`
- **Compound Indexes**: `{ recipient: 1, isRead: 1, createdAt: -1 }`

---

### 2.3 AI Document Tutor Models (Okapi BM25 Architecture)

#### Model 11: `Document` (`server/src/models/Document.ts`)
- **Fields**:
  - `owner`: ObjectId -> `User` (Required, Indexed)
  - `title`: String (Required)
  - `fileName`: String (Required)
  - `fileType`: String (Enum: `['pdf', 'docx', 'pptx']`)
  - `fileSize`: Number (Bytes)
  - `storagePath`: String (Required local relative path)
  - `chunkCount`: Number (Default: 0)
  - `tokenCount`: Number (Default: 0)
  - `processingStatus`: String (Enum: `['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']`, Default: `'PENDING'`)
  - `processingError`: String (Optional)
  - `timestamps`: `createdAt`, `updatedAt`

#### Model 12: `DocumentChunk` (`server/src/models/DocumentChunk.ts`)
- **Fields**:
  - `document`: ObjectId -> `Document` (Required, Indexed)
  - `owner`: ObjectId -> `User` (Required, Security index)
  - `chunkIndex`: Number (Required)
  - `content`: String (Required raw chunk text)
  - `tokenLength`: Number (Required token count)
  - `pageNumber`: Number (Optional metadata)
  - `metadata`: Schema.Types.Mixed
- **Indexes**: `{ document: 1, chunkIndex: 1 }`, `{ owner: 1 }`

#### Model 13: `DocumentConversation` (`server/src/models/DocumentConversation.ts`)
- **Fields**:
  - `user`: ObjectId -> `User` (Required, Indexed)
  - `document`: ObjectId -> `Document` (Required, Indexed)
  - `title`: String (Default: `'New Conversation'`)
  - `messages`: `[{ role: 'user' | 'assistant' | 'system', content: String, citations: [Number], timestamp: Date }]`
  - `timestamps`: `createdAt`, `updatedAt`

---

### 2.4 Learn & Teach Network Models

#### Models 14 through 24:
- **`Skill`**: `name` (Unique, Trimmed), `category` (`'PROGRAMMING'`, `'DESIGN'`, `'MATHEMATICS'`, `'ENGINEERING'`, `'OTHER'`), `description`, `icon`.
- **`TeachingListing`**: `teacher` (`User`), `skill` (`Skill`), `title`, `description`, `level` (`'BEGINNER'`, `'INTERMEDIATE'`, `'ADVANCED'`), `mode` (`'ONLINE'`, `'IN_PERSON'`), `availabilitySummary`, `isActive`.
- **`LearningGoal`**: `student` (`User`), `skill` (`Skill`), `targetDate`, `notes`, `progressPercentage` (0-100), `isCompleted`.
- **`SkillConnection`**: `learner` (`User`), `tutor` (`User`), `skill` (`Skill`), `listing` (`TeachingListing`), `status` (`'PENDING'`, `'ACCEPTED'`, `'REJECTED'`, `'COMPLETED'`), `initiatedBy` (`User`).
- **`LearningMessage`**: `connection` (`SkillConnection`), `sender` (`User`), `content` (Encrypted string), `isRead`.
- **`LearningSession`**: `connection` (`SkillConnection`), `learner` (`User`), `tutor` (`User`), `durationMinutes`, `topicsCovered`, `sessionDate`, `status` (`'SCHEDULED'`, `'COMPLETED'`, `'CANCELLED'`).
- **`LearningReview`**: `connection` (`SkillConnection`), `reviewer` (`User`), `reviewee` (`User`), `rating` (1 to 5), `comment`.
- **`LearningGroup`**: `name`, `description`, `creator` (`User`), `skill` (`Skill`), `maxMembers`, `isPrivate`.
- **`GroupMembership`**: `group` (`LearningGroup`), `user` (`User`), `role` (`'ADMIN'`, `'MEMBER'`), `joinedAt`.
- **`SkillProgress`**: `user` (`User`), `skill` (`Skill`), `proficiencyScore`, `verifiedSessionsCount`.
- **`LearnTeachReport`**: `reporter` (`User`), `reportedUser` (`User`), `reason`, `details`, `status` (`'PENDING'`, `'ACTION_TAKEN'`, `'DISMISSED'`), `reviewedBy` (`User`), `adminNotes`.

---

### 2.5 Campus Events & Admin Engine Models

#### Model 25: `CampusEvent` (`server/src/models/CampusEvent.ts`)
- **Fields**:
  - `title`: String (Required, Trimmed)
  - `category`: String (Enum: `['Workshops', 'Seminars', 'Guest Lectures', 'Webinars', 'Hackathons', 'Competitions', 'Technical Events', 'Cultural Events', 'Sports Events', 'Placement & Career Events', 'Club Activities', 'Faculty Events', 'Other']`)
  - `shortDescription`: String (Required)
  - `fullDescription`: String (Required)
  - `eventDate`: String (Required, YYYY-MM-DD, Indexed)
  - `startTime`: String (Required)
  - `endTime`: String (Required)
  - `mode`: String (Enum: `['ONLINE', 'OFFLINE']`)
  - `organizer`: ObjectId -> `User` (Required, Indexed)
  - `organizerDepartment`: String (Required)
  - `venue`: String (Optional for Offline)
  - `roomNumber`: String (Optional)
  - `meetingUrl`: String (Optional for Online)
  - `bannerUrl`: String (Optional)
  - `speakerName`: String (Optional)
  - `speakerDesignation`: String (Optional)
  - `maxCapacity`: Number (Default: 100)
  - `registeredCount`: Number (Default: 0)
  - `registrationDeadline`: Date (Optional)
  - `status`: String (Enum: `['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']`, Default: `'DRAFT'`, Indexed)
  - `isFeatured`: Boolean (Default: false, Indexed)
  - `cancellationReason`: String (Optional)
  - `timestamps`: `createdAt`, `updatedAt`

#### Models 26 through 31:
- **`EventRegistration`**: `event` (`CampusEvent`), `student` (`User`), `ticketCode` (UUID), `registeredAt`, `attended` (Boolean). Compound unique index `{ event: 1, student: 1 }`.
- **`EventReminderLog`**: `event` (`CampusEvent`), `student` (`User`), `reminderType` (`'24H'`, `'1H'`), `dispatchedAt`.
- **`ContactMessage`**: `name`, `email`, `subject`, `message`, `status` (`'NEW'`, `'IN_PROGRESS'`, `'RESOLVED'`), `resolvedBy` (`User`).
- **`PlatformSetting`**: Key-value system configuration store with `maintenanceMode`, `bookingLeadTimeHours`, `maxDailyAppointmentsPerStudent`, `allowedEmailDomains`.
- **`AdminAuditLog`**: `actor` (`User`), `action` (String), `targetEntity` (String), `targetId` (ObjectId), `details` (Schema.Types.Mixed), `ipAddress`, `userAgent`.
- **`EmailLog`**: `recipient`, `subject`, `templateName`, `status` (`'SENT'`, `'FAILED'`), `errorMessage`, `dispatchedAt`.

---

## 3. Referential Integrity & Security Review

1. **Cascade Deletes**:
   - `Document` deletion triggers cascading removal of all related `DocumentChunk` records via `documentService.delete`.
   - `CampusEvent` cancellation updates the status and notifies all registered participants via `EventRegistration`.
2. **Compound Index Optimization**:
   - High-throughput query routes utilize compound indexes (`{ teacher: 1, date: 1 }`, `{ recipient: 1, isRead: 1 }`, `{ event: 1, student: 1 }`), preventing full-collection scans in production.
3. **Data Isolation**:
   - AI Tutor chunk retrieval enforces `{ owner: userId }` on every query, guaranteeing that users can never access or query other students' uploaded academic documents.

