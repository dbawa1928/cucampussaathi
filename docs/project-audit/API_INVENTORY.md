# CUCampusSaathi — Complete Backend API Inventory

**Generated Date**: October 31, 2026  
**Auditor**: Principal Software Architect & API Auditor  
**Total Documented Endpoints**: 167 (164 Feature Endpoints + 3 Core RBAC Harness Endpoints)  
**Base URL**: `/api/v1`

---

## 1. Summary of API Surface by Router Module

| Router Module | File Source | Endpoints Count | Primary Role Scope |
|:---|:---|:---:|:---|
| **Auth** | `server/src/routes/authRoutes.ts` | 6 | Public / Authenticated |
| **Profile** | `server/src/routes/profileRoutes.ts` | 4 | Student / Teacher / Authenticated |
| **Directory** | `server/src/routes/directoryRoutes.ts` | 1 | Public |
| **Availability** | `server/src/routes/availabilityRoutes.ts` | 5 | Teacher / Public |
| **Appointments** | `server/src/routes/appointmentRoutes.ts` | 16 | Student / Teacher / Authenticated |
| **Reschedule** | `server/src/routes/rescheduleRoutes.ts` | 3 | Student / Teacher |
| **Teacher Restrictions** | `server/src/routes/teacherRestrictionRoutes.ts` | 6 | Teacher / Admin |
| **Notifications** | `server/src/routes/notificationRoutes.ts` | 5 | Authenticated |
| **Documents** | `server/src/routes/documentRoutes.ts` | 9 | Student / Authenticated |
| **AI Tutor** | `server/src/routes/aiTutorRoutes.ts` | 7 | Student / Authenticated |
| **Learn & Teach** | `server/src/routes/learnTeachRoutes.ts` | 53 | Student / Authenticated |
| **Campus Events** | `server/src/routes/eventRoutes.ts` | 14 | Public / Teacher / Student / Admin |
| **Admin Operations** | `server/src/routes/adminRoutes.ts` | 33 | Admin |
| **Contact Inquiries** | `server/src/routes/contactRoutes.ts` | 1 | Public |
| **Health** | `server/src/routes/healthRoutes.ts` | 1 | Public |
| **RBAC Test Harness** | `server/src/routes/index.ts` | 3 | Student / Teacher / Admin |
| **Total** | | **167** | |

---

## 2. Exhaustive Endpoint Directory

### 2.1 Authentication Endpoints (`/api/v1/auth`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 1 | `POST` | `/register` | No | Public | `register` | `authService.register` | `registerSchema` | `User`, `StudentProfile`, `TeacherProfile` |
| 2 | `POST` | `/login` | No | Public | `login` | `authService.login` | `loginSchema` | `User`, `RefreshToken` |
| 3 | `POST` | `/logout` | Yes | All | `logout` | `authService.logout` | None | `RefreshToken` |
| 4 | `POST` | `/refresh` | No | Public (Cookie) | `refreshToken` | `authService.refreshTokens` | None | `RefreshToken`, `User` |
| 5 | `POST` | `/forgot-password`| No | Public | `forgotPassword` | `authService.forgotPassword` | `forgotPasswordSchema`| `User`, `PasswordReset` |
| 6 | `POST` | `/reset-password` | No | Public | `resetPassword` | `authService.resetPassword` | `resetPasswordSchema` | `User`, `PasswordReset` |

### 2.2 Profile Endpoints (`/api/v1/profile`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 7 | `GET` | `/me` | Yes | All | `getMe` | `profileService.getProfile` | None | `User`, `StudentProfile`, `TeacherProfile` |
| 8 | `PUT` | `/student` | Yes | Student | `updateStudentProfile`| `profileService.updateStudent` | `studentProfileSchema` | `StudentProfile` |
| 9 | `PUT` | `/teacher` | Yes | Teacher | `updateTeacherProfile`| `profileService.updateTeacher` | `teacherProfileSchema` | `TeacherProfile` |
| 10 | `PUT` | `/privacy` | Yes | All | `updatePrivacy` | `profileService.updatePrivacy` | `privacySchema` | `StudentProfile`, `TeacherProfile` |

### 2.3 Faculty Directory (`/api/v1/directory`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 11 | `GET` | `/` | No | Public | `getDirectory` | `directoryService.search` | Query params | `TeacherProfile`, `User` |

### 2.4 Availability Management (`/api/v1/availability`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 12 | `GET` | `/my-slots` | Yes | Teacher | `getMySlots` | `availabilityService.getSlots` | Query params | `AvailabilitySlot` |
| 13 | `POST` | `/slots` | Yes | Teacher | `createSlot` | `availabilityService.createSlot` | `createSlotSchema` | `AvailabilitySlot` |
| 14 | `DELETE`| `/slots/:id` | Yes | Teacher | `deleteSlot` | `availabilityService.deleteSlot` | Param ID | `AvailabilitySlot`, `Appointment` |
| 15 | `POST` | `/generate-recurring` | Yes | Teacher | `generateRecurring` | `availabilityService.generateRecurring` | `recurringSlotSchema` | `AvailabilitySlot` |
| 16 | `GET` | `/teacher/:teacherId` | No | Public | `getTeacherSlots` | `availabilityService.getTeacherSlots` | Param ID | `AvailabilitySlot`, `TeacherProfile` |

### 2.5 Appointment Booking & Management (`/api/v1/appointments`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 17 | `POST` | `/` | Yes | Student | `bookAppointment` | `appointmentService.book` | `bookAppointmentSchema` | `Appointment`, `AvailabilitySlot`, `TeacherStudentRestriction` |
| 18 | `GET` | `/my` | Yes | Student, Teacher | `getMyAppointments`| `appointmentService.getUserAppointments` | Query params | `Appointment` |
| 19 | `GET` | `/attendance-history`| Yes | Student, Teacher | `getAttendanceHistory`| `appointmentService.getHistory` | Query params | `Appointment` |
| 20 | `GET` | `/:id` | Yes | Student, Teacher | `getAppointmentById` | `appointmentService.getById` | Param ID | `Appointment` |
| 21 | `PUT` | `/:id/accept` | Yes | Teacher | `acceptAppointment` | `appointmentService.accept` | Param ID | `Appointment` |
| 22 | `PUT` | `/:id/reject` | Yes | Teacher | `rejectAppointment` | `appointmentService.reject` | `rejectSchema` | `Appointment` |
| 23 | `PUT` | `/:id/cancel` | Yes | Student, Teacher | `cancelAppointment` | `appointmentService.cancel` | `cancelSchema` | `Appointment`, `AvailabilitySlot` |
| 24 | `PUT` | `/:id/attendance` | Yes | Teacher | `markAttendance` | `appointmentService.markAttendance` | `attendanceSchema` | `Appointment`, `StudentProfile` |
| 25 | `POST` | `/:id/appeal` | Yes | Student | `submitAppeal` | `appointmentService.submitAppeal` | `appealSchema` | `Appointment` |
| 26 | `PUT` | `/:id/appeal` | Yes | Teacher | `reviewAppeal` | `appointmentService.reviewAppeal` | `reviewAppealSchema`| `Appointment`, `StudentProfile` |
| 27 | `GET` | `/:id/timeline` | Yes | Student, Teacher | `getTimeline` | `appointmentService.getTimeline` | Param ID | `Appointment` |
| 28 | `POST` | `/:id/notes` | Yes | Teacher | `addTeacherNotes` | `appointmentService.addNotes` | `notesSchema` | `Appointment` |
| 29 | `GET` | `/student/:id/stats` | Yes | Teacher, Admin | `getStudentStats` | `appointmentService.getStudentStats` | Param ID | `Appointment`, `StudentProfile` |
| 30 | `GET` | `/teacher/:id/stats` | Yes | Admin | `getTeacherStats` | `appointmentService.getTeacherStats` | Param ID | `Appointment` |
| 31 | `POST` | `/:id/feedback` | Yes | Student | `submitFeedback` | `appointmentService.feedback` | `feedbackSchema` | `Appointment` |
| 32 | `GET` | `/summary/metrics` | Yes | Admin, Teacher | `getAppointmentMetrics` | `appointmentService.getMetrics` | Query params | `Appointment` |

### 2.6 Rescheduling System (`/api/v1/reschedule`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 33 | `POST` | `/propose` | Yes | Student, Teacher | `proposeReschedule` | `rescheduleService.propose` | `proposeRescheduleSchema` | `RescheduleProposal`, `Appointment` |
| 34 | `POST` | `/:id/accept` | Yes | Student, Teacher | `acceptReschedule` | `rescheduleService.accept` | Param ID | `RescheduleProposal`, `Appointment`, `AvailabilitySlot` |
| 35 | `POST` | `/:id/reject` | Yes | Student, Teacher | `rejectReschedule` | `rescheduleService.reject` | `rejectProposalSchema` | `RescheduleProposal`, `Appointment` |

### 2.7 Teacher Student Restrictions (`/api/v1/teacher-restrictions`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 36 | `POST` | `/block` | Yes | Teacher | `blockStudent` | `restrictionService.block` | `blockStudentSchema` | `TeacherStudentRestriction` |
| 37 | `POST` | `/unblock` | Yes | Teacher | `unblockStudent` | `restrictionService.unblock` | `unblockStudentSchema` | `TeacherStudentRestriction` |
| 38 | `GET` | `/my-restrictions`| Yes | Teacher | `getMyRestrictions` | `restrictionService.getMine` | Query params | `TeacherStudentRestriction` |
| 39 | `GET` | `/check/:studentId`| Yes | Teacher | `checkRestriction` | `restrictionService.check` | Param ID | `TeacherStudentRestriction` |
| 40 | `GET` | `/admin/all` | Yes | Admin | `getAllRestrictions`| `restrictionService.getAll` | Query params | `TeacherStudentRestriction` |
| 41 | `DELETE`| `/admin/:id` | Yes | Admin | `adminOverride` | `restrictionService.override`| Param ID | `TeacherStudentRestriction` |

### 2.8 Notification System (`/api/v1/notifications`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 42 | `GET` | `/` | Yes | All | `getNotifications` | `notificationService.getUserNotifications` | Query params | `Notification` |
| 43 | `GET` | `/unread-count` | Yes | All | `getUnreadCount` | `notificationService.getUnreadCount` | None | `Notification` |
| 44 | `PATCH`| `/:id/read` | Yes | All | `markAsRead` | `notificationService.markAsRead` | Param ID | `Notification` |
| 45 | `PATCH`| `/read-all` | Yes | All | `markAllAsRead` | `notificationService.markAllAsRead` | None | `Notification` |
| 46 | `DELETE`| `/:id` | Yes | All | `deleteNotification`| `notificationService.delete` | Param ID | `Notification` |

### 2.9 Document Management (`/api/v1/documents`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 47 | `POST` | `/upload` | Yes | Student, Teacher | `uploadDocument` | `documentService.upload` | Multer file check | `Document`, `DocumentChunk` |
| 48 | `GET` | `/` | Yes | Student, Teacher | `getMyDocuments` | `documentService.getMine` | Query params | `Document` |
| 49 | `GET` | `/:id` | Yes | Student, Teacher | `getDocumentById` | `documentService.getById` | Param ID | `Document` |
| 50 | `GET` | `/:id/download` | Yes | Student, Teacher | `downloadDocument` | `documentService.getFile` | Param ID | `Document` |
| 51 | `DELETE`| `/:id` | Yes | Student, Teacher | `deleteDocument` | `documentService.delete` | Param ID | `Document`, `DocumentChunk` |
| 52 | `GET` | `/:id/chunks` | Yes | Student, Teacher | `getDocumentChunks` | `documentService.getChunks` | Param ID | `DocumentChunk` |
| 53 | `GET` | `/user/metrics` | Yes | Student, Teacher | `getUserDocMetrics` | `documentService.getMetrics`| None | `Document` |
| 54 | `PATCH`| `/:id/rename` | Yes | Student, Teacher | `renameDocument` | `documentService.rename` | `renameSchema` | `Document` |
| 55 | `POST` | `/:id/reprocess` | Yes | Student, Teacher | `reprocessDocument` | `documentService.reprocess`| Param ID | `Document`, `DocumentChunk` |

### 2.10 AI Document Tutor (`/api/v1/ai-tutor`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Retrieval Method | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 56 | `POST` | `/chat` | Yes | Student, Teacher | `chatWithDocument` | `aiTutorService.generateResponse` | **Okapi BM25 Lexical** | `DocumentConversation`, `DocumentChunk` |
| 57 | `GET` | `/conversations` | Yes | Student, Teacher | `getConversations` | `aiTutorService.getConversations` | None | `DocumentConversation` |
| 58 | `GET` | `/conversations/:id` | Yes | Student, Teacher | `getConversationById` | `aiTutorService.getConversation` | None | `DocumentConversation` |
| 59 | `DELETE`| `/conversations/:id` | Yes | Student, Teacher | `deleteConversation` | `aiTutorService.deleteConversation`| None | `DocumentConversation` |
| 60 | `POST` | `/conversations/:id/rename` | Yes | Student, Teacher | `renameConversation` | `aiTutorService.renameConversation`| `renameSchema` | `DocumentConversation` |
| 61 | `POST` | `/suggested-questions` | Yes | Student, Teacher | `getSuggestedQuestions`| `aiTutorService.getSuggestions` | In-memory summary | `DocumentChunk` |
| 62 | `POST` | `/summarize` | Yes | Student, Teacher | `summarizeDocument` | `aiTutorService.summarize` | LLM Context reduction | `DocumentChunk` |

### 2.11 Learn & Teach Network (`/api/v1/learn-teach`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|
| 63 | `GET` | `/skills` | Yes | All | `getSkills` | `learnTeachService.getSkills` | `Skill` |
| 64 | `POST` | `/skills` | Yes | All | `createSkill` | `learnTeachService.createSkill` | `Skill` |
| 65 | `GET` | `/skills/popular` | Yes | All | `getPopularSkills` | `learnTeachService.getPopularSkills` | `Skill`, `TeachingListing` |
| 66 | `GET` | `/skills/:id` | Yes | All | `getSkillById` | `learnTeachService.getSkillById` | `Skill` |
| 67 | `GET` | `/teaching-listings` | Yes | All | `getListings` | `learnTeachService.getListings` | `TeachingListing` |
| 68 | `POST` | `/teaching-listings` | Yes | Student | `createListing` | `learnTeachService.createListing` | `TeachingListing` |
| 69 | `GET` | `/teaching-listings/my` | Yes | Student | `getMyListings` | `learnTeachService.getMyListings` | `TeachingListing` |
| 70 | `GET` | `/teaching-listings/:id` | Yes | All | `getListingById` | `learnTeachService.getListingById` | `TeachingListing` |
| 71 | `PUT` | `/teaching-listings/:id` | Yes | Student | `updateListing` | `learnTeachService.updateListing` | `TeachingListing` |
| 72 | `DELETE`| `/teaching-listings/:id` | Yes | Student | `deleteListing` | `learnTeachService.deleteListing` | `TeachingListing` |
| 73 | `PATCH`| `/teaching-listings/:id/status`| Yes | Student | `toggleListingStatus` | `learnTeachService.toggleListingStatus` | `TeachingListing` |
| 74 | `GET` | `/learning-goals` | Yes | Student | `getMyGoals` | `learnTeachService.getMyGoals` | `LearningGoal` |
| 75 | `POST` | `/learning-goals` | Yes | Student | `createGoal` | `learnTeachService.createGoal` | `LearningGoal` |
| 76 | `GET` | `/learning-goals/:id` | Yes | Student | `getGoalById` | `learnTeachService.getGoalById` | `LearningGoal` |
| 77 | `PUT` | `/learning-goals/:id` | Yes | Student | `updateGoal` | `learnTeachService.updateGoal` | `LearningGoal` |
| 78 | `DELETE`| `/learning-goals/:id` | Yes | Student | `deleteGoal` | `learnTeachService.deleteGoal` | `LearningGoal` |
| 79 | `PATCH`| `/learning-goals/:id/progress` | Yes | Student | `updateGoalProgress`| `learnTeachService.updateGoalProgress` | `LearningGoal` |
| 80 | `GET` | `/peers/explore` | Yes | All | `explorePeers` | `learnTeachService.explorePeers` | `User`, `TeachingListing`, `StudentProfile` |
| 81 | `GET` | `/peers/matches` | Yes | Student | `getMatches` | `learnTeachService.getMatches` | `TeachingListing`, `LearningGoal` |
| 82 | `GET` | `/peers/:id` | Yes | All | `getPeerProfile` | `learnTeachService.getPeerProfile` | `User`, `StudentProfile`, `TeachingListing` |
| 83 | `POST` | `/connections` | Yes | Student | `createConnection` | `learnTeachService.createConnection` | `SkillConnection` |
| 84 | `GET` | `/connections` | Yes | Student | `getMyConnections` | `learnTeachService.getMyConnections` | `SkillConnection` |
| 85 | `GET` | `/connections/:id` | Yes | Student | `getConnectionById` | `learnTeachService.getConnectionById` | `SkillConnection` |
| 86 | `PATCH`| `/connections/:id/accept` | Yes | Student | `acceptConnection` | `learnTeachService.acceptConnection` | `SkillConnection` |
| 87 | `PATCH`| `/connections/:id/reject` | Yes | Student | `rejectConnection` | `learnTeachService.rejectConnection` | `SkillConnection` |
| 88 | `PATCH`| `/connections/:id/cancel` | Yes | Student | `cancelConnection` | `learnTeachService.cancelConnection` | `SkillConnection` |
| 89 | `PATCH`| `/connections/:id/complete` | Yes | Student | `completeConnection`| `learnTeachService.completeConnection` | `SkillConnection` |
| 90 | `GET` | `/messages` | Yes | Student | `getMessages` | `learnTeachService.getMessages` | `LearningMessage` |
| 91 | `POST` | `/messages` | Yes | Student | `sendMessage` | `learnTeachService.sendMessage` | `LearningMessage` |
| 92 | `PATCH`| `/messages/mark-read` | Yes | Student | `markMessagesRead` | `learnTeachService.markMessagesRead` | `LearningMessage` |
| 93 | `GET` | `/messages/threads` | Yes | Student | `getMessageThreads` | `learnTeachService.getMessageThreads` | `LearningMessage` |
| 94 | `GET` | `/sessions` | Yes | Student | `getSessions` | `learnTeachService.getSessions` | `LearningSession` |
| 95 | `POST` | `/sessions` | Yes | Student | `createSession` | `learnTeachService.createSession` | `LearningSession` |
| 96 | `GET` | `/sessions/:id` | Yes | Student | `getSessionById` | `learnTeachService.getSessionById` | `LearningSession` |
| 97 | `PATCH`| `/sessions/:id/status` | Yes | Student | `updateSessionStatus`| `learnTeachService.updateSessionStatus` | `LearningSession` |
| 98 | `POST` | `/sessions/:id/notes` | Yes | Student | `addSessionNotes` | `learnTeachService.addSessionNotes` | `LearningSession` |
| 99 | `GET` | `/groups` | Yes | All | `getGroups` | `learnTeachService.getGroups` | `LearningGroup` |
| 100| `POST` | `/groups` | Yes | Student | `createGroup` | `learnTeachService.createGroup` | `LearningGroup`, `GroupMembership` |
| 101| `GET` | `/groups/my` | Yes | Student | `getMyGroups` | `learnTeachService.getMyGroups` | `LearningGroup`, `GroupMembership` |
| 102| `GET` | `/groups/:id` | Yes | All | `getGroupById` | `learnTeachService.getGroupById` | `LearningGroup` |
| 103| `PUT` | `/groups/:id` | Yes | Student | `updateGroup` | `learnTeachService.updateGroup` | `LearningGroup` |
| 104| `POST` | `/groups/:id/join` | Yes | Student | `joinGroup` | `learnTeachService.joinGroup` | `GroupMembership`, `LearningGroup` |
| 105| `POST` | `/groups/:id/leave` | Yes | Student | `leaveGroup` | `learnTeachService.leaveGroup` | `GroupMembership`, `LearningGroup` |
| 106| `GET` | `/groups/:id/members` | Yes | All | `getGroupMembers` | `learnTeachService.getGroupMembers` | `GroupMembership` |
| 107| `POST` | `/reviews` | Yes | Student | `createReview` | `learnTeachService.createReview` | `LearningReview` |
| 108| `GET` | `/reviews/user/:userId` | Yes | All | `getUserReviews` | `learnTeachService.getUserReviews` | `LearningReview` |
| 109| `GET` | `/reviews/listing/:listingId` | Yes | All | `getListingReviews` | `learnTeachService.getListingReviews` | `LearningReview` |
| 110| `POST` | `/reports` | Yes | Student | `createReport` | `learnTeachService.createReport` | `LearnTeachReport` |
| 111| `GET` | `/reports/my` | Yes | Student | `getMyReports` | `learnTeachService.getMyReports` | `LearnTeachReport` |
| 112| `GET` | `/progress/my` | Yes | Student | `getMyProgress` | `learnTeachService.getMyProgress` | `SkillProgress` |
| 113| `POST` | `/progress` | Yes | Student | `recordProgress` | `learnTeachService.recordProgress` | `SkillProgress` |
| 114| `GET` | `/stats/overview` | Yes | Student | `getStudentOverview`| `learnTeachService.getStudentOverview` | Multiple collections |
| 115| `GET` | `/explore/leaderboard` | Yes | All | `getLeaderboard` | `learnTeachService.getLeaderboard` | `LearningReview`, `LearningSession` |

### 2.12 Campus Events Calendar (`/api/v1/events`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 116| `GET` | `/` | No | Public | `getEvents` | `eventService.getEvents` | `getEventsQuerySchema` | `CampusEvent` |
| 117| `GET` | `/featured` | No | Public | `getFeaturedEvents`| `eventService.getFeaturedEvents` | None | `CampusEvent` |
| 118| `GET` | `/manage/mine` | Yes | Teacher, Admin | `getMyManagedEvents` | `eventService.getMyManagedEvents` | Query params | `CampusEvent` |
| 119| `GET` | `/my/registrations` | Yes | Student | `getMyRegistrations`| `eventService.getMyRegistrations` | None | `EventRegistration`, `CampusEvent` |
| 120| `GET` | `/:id` | No | Public | `getEventById` | `eventService.getEventById` | Param ID | `CampusEvent`, `EventRegistration` |
| 121| `POST` | `/` | Yes | Teacher, Admin | `createEvent` | `eventService.createEvent` | `createEventSchema` | `CampusEvent` |
| 122| `PUT` | `/:id` | Yes | Teacher, Admin | `updateEvent` | `eventService.updateEvent` | `updateEventSchema` | `CampusEvent` |
| 123| `PUT` | `/:id/publish` | Yes | Teacher, Admin | `publishEvent` | `eventService.publishEvent` | Param ID | `CampusEvent` |
| 124| `PUT` | `/:id/cancel` | Yes | Teacher, Admin | `cancelEvent` | `eventService.cancelEvent` | `cancelEventSchema` | `CampusEvent`, `EventRegistration` |
| 125| `DELETE`| `/:id` | Yes | Teacher, Admin | `deleteEvent` | `eventService.deleteEvent` | Param ID | `CampusEvent` |
| 126| `POST` | `/:id/register` | Yes | Student | `registerForEvent` | `eventService.registerForEvent` | Param ID | `EventRegistration`, `CampusEvent` |
| 127| `DELETE`| `/:id/register` | Yes | Student | `cancelRegistration`| `eventService.cancelRegistration` | Param ID | `EventRegistration`, `CampusEvent` |
| 128| `GET` | `/:id/attendees` | Yes | Teacher, Admin | `getEventAttendees`| `eventService.getEventAttendees` | Param ID | `EventRegistration` |
| 129| `POST` | `/:id/reminders` | Yes | Admin | `triggerEventReminders` | `eventService.triggerEventReminders` | Param ID | `EventReminderLog`, `CampusEvent` |

### 2.13 Admin Operations & University Control Engine (`/api/v1/admin`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|
| 130| `GET` | `/overview` | Yes | Admin | `getOverview` | `adminService.getOverviewStats` | Multiple collections |
| 131| `GET` | `/users` | Yes | Admin | `getUsers` | `adminService.listUsers` | `User`, `StudentProfile`, `TeacherProfile` |
| 132| `GET` | `/users/:id/dossier` | Yes | Admin | `getUserDossier` | `adminService.getUser360Dossier` | Aggregated user collections |
| 133| `PATCH`| `/users/:id/status` | Yes | Admin | `updateUserStatus` | `adminService.updateUserStatus` | `User`, `AdminAuditLog` |
| 134| `PATCH`| `/users/:id/role` | Yes | Admin | `updateUserRole` | `adminService.updateUserRole` | `User`, `AdminAuditLog` |
| 135| `GET` | `/verifications` | Yes | Admin | `getVerifications` | `adminService.listPendingVerifications` | `TeacherProfile`, `User` |
| 136| `PATCH`| `/verifications/:id/approve` | Yes | Admin | `approveVerification` | `adminService.approveVerification` | `TeacherProfile`, `AdminAuditLog` |
| 137| `PATCH`| `/verifications/:id/reject` | Yes | Admin | `rejectVerification` | `adminService.rejectVerification` | `TeacherProfile`, `AdminAuditLog` |
| 138| `GET` | `/appointments` | Yes | Admin | `getAppointments` | `adminService.listGlobalAppointments` | `Appointment` |
| 139| `PATCH`| `/appointments/:id/force-cancel` | Yes | Admin | `forceCancelAppointment` | `adminService.forceCancelAppointment` | `Appointment`, `AdminAuditLog` |
| 140| `GET` | `/attendance/overview` | Yes | Admin | `getAttendanceOverview` | `adminService.getAttendanceOverview` | `Appointment`, `StudentProfile` |
| 141| `PATCH`| `/attendance/appeals/:id/override`| Yes | Admin | `overrideAppeal` | `adminService.overrideAppealDecision` | `Appointment`, `StudentProfile`, `AdminAuditLog` |
| 142| `GET` | `/restrictions` | Yes | Admin | `getRestrictions` | `adminService.listRestrictions` | `TeacherStudentRestriction` |
| 143| `DELETE`| `/restrictions/:id/override` | Yes | Admin | `overrideRestriction`| `adminService.overrideRestriction` | `TeacherStudentRestriction`, `AdminAuditLog` |
| 144| `GET` | `/moderation/learn-teach` | Yes | Admin | `getLearnTeachReports` | `adminService.listLearnTeachReports` | `LearnTeachReport` |
| 145| `PATCH`| `/moderation/learn-teach/:id/review`| Yes | Admin | `reviewLearnTeachReport` | `adminService.reviewLearnTeachReport` | `LearnTeachReport`, `AdminAuditLog` |
| 146| `GET` | `/events` | Yes | Admin | `getEvents` | `adminService.listEvents` | `CampusEvent` |
| 147| `PATCH`| `/events/:id/toggle-feature` | Yes | Admin | `toggleEventFeature` | `adminService.toggleEventFeature` | `CampusEvent`, `AdminAuditLog` |
| 148| `PATCH`| `/events/:id/cancel` | Yes | Admin | `adminCancelEvent` | `adminService.adminCancelEvent` | `CampusEvent`, `AdminAuditLog` |
| 149| `GET` | `/contact-messages` | Yes | Admin | `getContactMessages` | `adminService.listContactMessages` | `ContactMessage` |
| 150| `PATCH`| `/contact-messages/:id/status` | Yes | Admin | `updateContactMessageStatus`| `adminService.updateContactMessageStatus` | `ContactMessage`, `AdminAuditLog` |
| 151| `GET` | `/settings` | Yes | Admin | `getSettings` | `adminService.getPlatformSettings` | `PlatformSetting` |
| 152| `PUT` | `/settings` | Yes | Admin | `updateSettings` | `adminService.updatePlatformSettings` | `PlatformSetting`, `AdminAuditLog` |
| 153| `GET` | `/reports/analytics` | Yes | Admin | `getReportsAnalytics` | `adminService.getReportsAnalytics` | Aggregated analytics |
| 154| `GET` | `/reports/export-csv` | Yes | Admin | `exportReportCsv` | `adminService.exportReportCsv` | Streaming CSV |
| 155| `GET` | `/audit-logs` | Yes | Admin | `getAuditLogs` | `adminService.listAuditLogs` | `AdminAuditLog` |
| 156| `GET` | `/search` | Yes | Admin | `universalSearch` | `adminService.universalSearch` | Universal entity query |
| 157| `GET` | `/system/health` | Yes | Admin | `getSystemHealth` | `adminService.getSystemHealth` | Process, memory, MongoDB status |
| 158| `POST` | `/maintenance/enable` | Yes | Admin | `enableMaintenance` | `adminService.setMaintenance` | `PlatformSetting`, `AdminAuditLog` |
| 159| `POST` | `/maintenance/disable` | Yes | Admin | `disableMaintenance` | `adminService.setMaintenance` | `PlatformSetting`, `AdminAuditLog` |
| 160| `POST` | `/cache/clear` | Yes | Admin | `clearCache` | `adminService.clearCache` | In-memory cache reset |
| 161| `GET` | `/documents/overview` | Yes | Admin | `getDocumentsOverview`| `adminService.getDocumentsOverview` | `Document`, `DocumentChunk` |
| 162| `DELETE`| `/documents/:id/force-delete`| Yes | Admin | `forceDeleteDocument` | `adminService.forceDeleteDocument` | `Document`, `DocumentChunk`, `AdminAuditLog` |

### 2.14 Contact Inquiries (`/api/v1/contact`)

| # | Method | Path | Auth | Roles | Controller Function | Service Layer | Validation Schema | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|:---|
| 163| `POST` | `/` | No | Public | `submitContactMessage` | `contactService.submit` | `contactMessageSchema` | `ContactMessage` |

### 2.15 Health & RBAC Test Harness (`/api/v1/health` & `/api/v1/test`)

| # | Method | Path | Auth | Roles | Controller Function | Purpose | Models |
|:---:|:---|:---|:---:|:---|:---|:---|:---|
| 164| `GET` | `/health` | No | Public | Inline handler | Production uptime probe (returns 200 OK, timestamp, uptime) | None |
| 165| `GET` | `/test/student-only` | Yes | Student | Inline handler | Automated integration test fixture for Student RBAC | None |
| 166| `GET` | `/test/teacher-only` | Yes | Teacher | Inline handler | Automated integration test fixture for Teacher RBAC | None |
| 167| `GET` | `/test/admin-only` | Yes | Admin | Inline handler | Automated integration test fixture for Admin RBAC | None |

