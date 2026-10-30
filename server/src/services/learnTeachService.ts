import { Types } from 'mongoose';
import {
  SkillModel,
  ISkill,
  TeachingListingModel,
  ITeachingListing,
  LearningGoalModel,
  ILearningGoal,
  SkillConnectionModel,
  ISkillConnection,
  LearningSessionModel,
  ILearningSession,
  LearningGroupModel,
  ILearningGroup,
  GroupMembershipModel,
  IGroupMembership,
  LearningMessageModel,
  ILearningMessage,
  LearningReviewModel,
  ILearningReview,
  SkillProgressModel,
  ISkillProgress,
  LearnTeachReportModel,
  User,
  IUser,
  StudentProfile,
  TeacherProfile,
  Notification,
} from '../models';
import { DEFAULT_UNIVERSITY_SKILLS } from './skillCatalogueData';
import { emitToUser, emitToConnection, emitToGroup } from '../socket';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class LearnTeachService {
  /**
   * 1. SKILL CATALOGUE
   */
  async ensureDefaultSkillsSeeded(): Promise<void> {
    const count = await SkillModel.countDocuments();
    if (count === 0) {
      logger.info('Seeding default university skill catalogue...');
      const seedDocs = DEFAULT_UNIVERSITY_SKILLS.map((s) => ({
        name: s.name,
        normalizedName: s.name.trim().toLowerCase(),
        category: s.category,
        description: s.description,
        isActive: true,
        isCustom: false,
      }));
      await SkillModel.insertMany(seedDocs, { ordered: false }).catch(() => {});
      logger.info(`Seeded ${seedDocs.length} university skills successfully.`);
    }
  }

  async listSkills(search?: string, category?: string): Promise<ISkill[]> {
    await this.ensureDefaultSkillsSeeded();
    const query: any = { isActive: true };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    return SkillModel.find(query).sort({ category: 1, name: 1 });
  }

  async getOrCreateSkill(skillName: string, category: string, userId?: string): Promise<ISkill> {
    const normalized = skillName.trim().toLowerCase();
    let skill = await SkillModel.findOne({ normalizedName: normalized });
    if (!skill) {
      skill = await SkillModel.create({
        name: skillName.trim(),
        normalizedName: normalized,
        category,
        isCustom: true,
        isActive: true,
        creator: userId ? new Types.ObjectId(userId) : undefined,
      });
    }
    return skill;
  }

  /**
   * 2. TEACHING LISTINGS
   */
  async createTeachingListing(userId: string, data: {
    skillName: string;
    category: string;
    expertiseLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    experienceMonths: number;
    description: string;
    teachingMode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
    teachingType?: 'INDIVIDUAL' | 'GROUP' | 'BOTH';
    languages?: string[];
    days?: string[];
    timeSlots?: string[];
    maxLearners?: number;
    preferredSchedule?: string;
    proofUrl?: string;
  }): Promise<ITeachingListing> {
    const skill = await this.getOrCreateSkill(data.skillName, data.category, userId);

    // Check if user already has an active listing for this skill
    const existing = await TeachingListingModel.findOne({
      user: new Types.ObjectId(userId),
      skill: skill._id,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    });

    if (existing) {
      throw new AppError(`You already have a published listing for "${data.skillName}". Please edit your existing listing.`, 400);
    }

    const listing = await TeachingListingModel.create({
      user: new Types.ObjectId(userId),
      skill: skill._id,
      skillName: skill.name,
      category: skill.category,
      expertiseLevel: data.expertiseLevel,
      experienceMonths: Math.max(0, data.experienceMonths || 0),
      description: data.description.trim(),
      teachingMode: data.teachingMode || 'BOTH',
      teachingType: data.teachingType || 'BOTH',
      languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : ['English', 'Hindi'],
      availability: {
        days: data.days || ['Monday', 'Wednesday', 'Friday'],
        timeSlots: data.timeSlots || ['Evening (4 PM - 7 PM)'],
      },
      maxLearners: data.maxLearners || 5,
      preferredSchedule: data.preferredSchedule?.trim(),
      proofUrl: data.proofUrl?.trim(),
      status: 'ACTIVE',
    });

    return listing;
  }

  async getUserTeachingListings(userId: string): Promise<ITeachingListing[]> {
    return TeachingListingModel.find({
      user: new Types.ObjectId(userId),
      status: { $ne: 'DELETED' },
    }).populate('skill').sort({ createdAt: -1 });
  }

  async updateTeachingListing(userId: string, listingId: string, updates: Partial<ITeachingListing>): Promise<ITeachingListing> {
    const listing = await TeachingListingModel.findOne({
      _id: new Types.ObjectId(listingId),
      user: new Types.ObjectId(userId),
    });

    if (!listing) {
      throw new AppError('Teaching listing not found or unauthorized to update.', 404);
    }

    const allowed = [
      'expertiseLevel',
      'experienceMonths',
      'description',
      'teachingMode',
      'teachingType',
      'languages',
      'availability',
      'maxLearners',
      'preferredSchedule',
      'proofUrl',
      'status',
    ];

    allowed.forEach((field) => {
      if ((updates as any)[field] !== undefined) {
        (listing as any)[field] = (updates as any)[field];
      }
    });

    await listing.save();
    return listing;
  }

  async deleteTeachingListing(userId: string, listingId: string): Promise<void> {
    const listing = await TeachingListingModel.findOne({
      _id: new Types.ObjectId(listingId),
      user: new Types.ObjectId(userId),
    });

    if (!listing) {
      throw new AppError('Teaching listing not found or unauthorized.', 404);
    }

    listing.status = 'DELETED';
    await listing.save();
  }

  /**
   * 3. LEARNING GOALS
   */
  async createLearningGoal(userId: string, data: {
    skillName: string;
    category: string;
    currentLevel?: 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    targetLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    learningObjective: string;
    preferredMode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
    preferredType?: 'INDIVIDUAL' | 'GROUP' | 'BOTH';
    preferredLanguages?: string[];
    availableDays?: string[];
    preferredTime?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    expectedDuration?: string;
  }): Promise<ILearningGoal> {
    const skill = await this.getOrCreateSkill(data.skillName, data.category, userId);

    const existing = await LearningGoalModel.findOne({
      user: new Types.ObjectId(userId),
      skill: skill._id,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    });

    if (existing) {
      throw new AppError(`You already have a learning goal for "${data.skillName}". Please edit your existing goal.`, 400);
    }

    const goal = await LearningGoalModel.create({
      user: new Types.ObjectId(userId),
      skill: skill._id,
      skillName: skill.name,
      category: skill.category,
      currentLevel: data.currentLevel || 'BEGINNER',
      targetLevel: data.targetLevel || 'INTERMEDIATE',
      learningObjective: data.learningObjective.trim(),
      preferredMode: data.preferredMode || 'BOTH',
      preferredType: data.preferredType || 'BOTH',
      preferredLanguages: data.preferredLanguages || ['English', 'Hindi'],
      availableDays: data.availableDays || ['Saturday', 'Sunday'],
      preferredTime: data.preferredTime?.trim(),
      urgency: data.urgency || 'MEDIUM',
      expectedDuration: data.expectedDuration?.trim(),
      status: 'ACTIVE',
    });

    // Auto-create or link initial skill progress record
    await SkillProgressModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId), skill: skill._id },
      {
        $setOnInsert: {
          user: new Types.ObjectId(userId),
          skill: skill._id,
          skillName: skill.name,
          learningGoal: goal._id,
          startingLevel: goal.currentLevel,
          currentLevel: goal.currentLevel,
          targetLevel: goal.targetLevel,
          completedSessionsCount: 0,
          milestones: [
            { id: 'm1', title: `Understand fundamentals of ${skill.name}`, completed: false },
            { id: 'm2', title: `Complete first guided exercise with mentor`, completed: false },
            { id: 'm3', title: `Build hands-on mini project demonstrating ${skill.name}`, completed: false },
            { id: 'm4', title: `Review and self-assess target proficiency`, completed: false },
          ],
          isCompleted: false,
        },
      },
      { upsert: true }
    );

    return goal;
  }

  async getUserLearningGoals(userId: string): Promise<ILearningGoal[]> {
    return LearningGoalModel.find({
      user: new Types.ObjectId(userId),
      status: { $ne: 'DELETED' },
    }).populate('skill').sort({ createdAt: -1 });
  }

  async updateLearningGoal(userId: string, goalId: string, updates: Partial<ILearningGoal>): Promise<ILearningGoal> {
    const goal = await LearningGoalModel.findOne({
      _id: new Types.ObjectId(goalId),
      user: new Types.ObjectId(userId),
    });

    if (!goal) {
      throw new AppError('Learning goal not found or unauthorized to update.', 404);
    }

    const allowed = [
      'currentLevel',
      'targetLevel',
      'learningObjective',
      'preferredMode',
      'preferredType',
      'preferredLanguages',
      'availableDays',
      'preferredTime',
      'urgency',
      'expectedDuration',
      'status',
    ];

    allowed.forEach((field) => {
      if ((updates as any)[field] !== undefined) {
        (goal as any)[field] = (updates as any)[field];
      }
    });

    await goal.save();
    return goal;
  }

  async deleteLearningGoal(userId: string, goalId: string): Promise<void> {
    const goal = await LearningGoalModel.findOne({
      _id: new Types.ObjectId(goalId),
      user: new Types.ObjectId(userId),
    });

    if (!goal) {
      throw new AppError('Learning goal not found or unauthorized.', 404);
    }

    goal.status = 'DELETED';
    await goal.save();
  }

  /**
   * 4. DISCOVER PEOPLE (Cross-role search with filters & profile details)
   */
  async discoverPeople(params: {
    currentUserId?: string;
    skill?: string;
    role?: 'STUDENT' | 'TEACHER' | 'ALL';
    department?: string;
    teachingMode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
    expertiseLevel?: string;
    language?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    people: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 12));
    const skip = (page - 1) * limit;

    // 1. Build listings filter
    const listingQuery: any = { status: 'ACTIVE' };

    if (params.currentUserId) {
      listingQuery.user = { $ne: new Types.ObjectId(params.currentUserId) };
    }

    if (params.skill && params.skill.trim()) {
      listingQuery.$or = [
        { skillName: { $regex: params.skill.trim(), $options: 'i' } },
        { category: { $regex: params.skill.trim(), $options: 'i' } },
      ];
    }

    if (params.teachingMode && params.teachingMode !== 'BOTH') {
      listingQuery.teachingMode = { $in: [params.teachingMode, 'BOTH'] };
    }

    if (params.expertiseLevel && params.expertiseLevel !== 'ALL') {
      listingQuery.expertiseLevel = params.expertiseLevel;
    }

    if (params.language && params.language !== 'ALL') {
      listingQuery.languages = { $regex: params.language, $options: 'i' };
    }

    // Get active user IDs with matching teaching listings
    const matchedListings = await TeachingListingModel.find(listingQuery);
    const userIds = Array.from(new Set(matchedListings.map((l) => l.user.toString())));

    // 2. Filter users
    const userQuery: any = {
      _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      accountStatus: 'ACTIVE',
    };

    if (params.role && params.role !== 'ALL') {
      userQuery.role = params.role;
    }

    if (params.department && params.department.trim()) {
      userQuery.department = { $regex: params.department.trim(), $options: 'i' };
    }

    if (params.search && params.search.trim()) {
      userQuery.$or = [
        { fullName: { $regex: params.search.trim(), $options: 'i' } },
        { email: { $regex: params.search.trim(), $options: 'i' } },
        { department: { $regex: params.search.trim(), $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery).select('-passwordHash').skip(skip).limit(limit),
    ]);

    // Attach active teaching skills, learning goals, and profiles
    const people = await Promise.all(
      users.map(async (u: IUser) => {
        const [teachingSkills, learningGoals, studentProfile, teacherProfile] = await Promise.all([
          TeachingListingModel.find({ user: u._id, status: 'ACTIVE' }),
          LearningGoalModel.find({ user: u._id, status: 'ACTIVE' }),
          u.role === 'STUDENT' ? StudentProfile.findOne({ user: u._id }) : null,
          u.role === 'TEACHER' ? TeacherProfile.findOne({ user: u._id }) : null,
        ]);

        return {
          user: {
            _id: u._id,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            department: u.department,
            isVerified: u.isVerified,
          },
          profile: {
            course: studentProfile?.course,
            semester: studentProfile?.semester,
            bio: studentProfile?.bio,
            designation: teacherProfile?.designation,
            officeLocation: teacherProfile?.officeLocation,
            socialLinks: studentProfile?.socialLinks,
          },
          teachingSkills,
          learningGoals,
        };
      })
    );

    return {
      people,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 5. CONNECTIONS LIFECYCLE
   */
  async sendConnectionRequest(senderId: string, data: {
    receiverId: string;
    skillId: string;
    teachingListingId?: string;
    learningGoalId?: string;
    requestMessage: string;
    learningObjective?: string;
    preferredMode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
    preferredSchedule?: string;
  }): Promise<ISkillConnection> {
    if (senderId === data.receiverId) {
      throw new AppError('You cannot send a connection request to yourself.', 400);
    }

    const receiver = await User.findById(data.receiverId);
    if (!receiver || receiver.accountStatus === 'SUSPENDED') {
      throw new AppError('Target user is not available for connections.', 404);
    }

    const skill = await SkillModel.findById(data.skillId);
    if (!skill) {
      throw new AppError('Skill not found.', 404);
    }

    // Check for existing active or pending connection between these two users for this skill
    const existing = await SkillConnectionModel.findOne({
      $or: [
        { sender: new Types.ObjectId(senderId), receiver: new Types.ObjectId(data.receiverId) },
        { sender: new Types.ObjectId(data.receiverId), receiver: new Types.ObjectId(senderId) },
      ],
      skill: skill._id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new AppError(`You are already actively connected with ${receiver.fullName} for ${skill.name}.`, 400);
      }
      throw new AppError(`A connection request for ${skill.name} is already pending between you and ${receiver.fullName}.`, 400);
    }

    const connection = await SkillConnectionModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(data.receiverId),
      skill: skill._id,
      teachingListing: data.teachingListingId ? new Types.ObjectId(data.teachingListingId) : undefined,
      learningGoal: data.learningGoalId ? new Types.ObjectId(data.learningGoalId) : undefined,
      status: 'PENDING',
      requestMessage: data.requestMessage.trim(),
      learningObjective: data.learningObjective?.trim(),
      preferredMode: data.preferredMode || 'BOTH',
      preferredSchedule: data.preferredSchedule?.trim(),
    });

    // Send in-app notification & socket event
    const sender = await User.findById(senderId);
    await Notification.create({
      recipient: receiver._id,
      type: 'LEARN_TEACH_CONNECTION_REQUEST',
      title: 'New Learning Connection Request',
      message: `${sender?.fullName || 'A student/faculty peer'} wants to connect with you for ${skill.name}.`,
      metadata: { connectionId: connection._id, skillName: skill.name },
    }).catch(() => {});

    emitToUser(receiver._id.toString(), 'learn_teach:connection_request', {
      connectionId: connection._id,
      sender: { _id: senderId, fullName: sender?.fullName },
      skillName: skill.name,
    });

    return connection;
  }

  async acceptConnectionRequest(userId: string, connectionId: string): Promise<ISkillConnection> {
    const connection = await SkillConnectionModel.findOne({
      _id: new Types.ObjectId(connectionId),
      receiver: new Types.ObjectId(userId),
      status: 'PENDING',
    }).populate('skill sender');

    if (!connection) {
      throw new AppError('Pending connection request not found or unauthorized to accept.', 404);
    }

    connection.status = 'ACCEPTED';
    await connection.save();

    const receiver = await User.findById(userId);
    const skillName = (connection.skill as any)?.name || 'the requested skill';

    // Notify sender that connection was accepted
    await Notification.create({
      recipient: connection.sender,
      type: 'LEARN_TEACH_CONNECTION_ACCEPTED',
      title: 'Connection Request Accepted! 🎉',
      message: `${receiver?.fullName || 'Your peer'} accepted your connection request for ${skillName}. You can now chat and schedule sessions!`,
      metadata: { connectionId: connection._id },
    }).catch(() => {});

    emitToUser(connection.sender.toString(), 'learn_teach:connection_accepted', {
      connectionId: connection._id,
      receiver: { _id: userId, fullName: receiver?.fullName },
      skillName,
    });

    return connection;
  }

  async rejectConnectionRequest(userId: string, connectionId: string, reason?: string): Promise<ISkillConnection> {
    const connection = await SkillConnectionModel.findOne({
      _id: new Types.ObjectId(connectionId),
      receiver: new Types.ObjectId(userId),
      status: 'PENDING',
    });

    if (!connection) {
      throw new AppError('Pending connection request not found or unauthorized.', 404);
    }

    connection.status = 'REJECTED';
    connection.rejectionReason = reason?.trim();
    await connection.save();

    return connection;
  }

  async withdrawConnectionRequest(userId: string, connectionId: string): Promise<ISkillConnection> {
    const connection = await SkillConnectionModel.findOne({
      _id: new Types.ObjectId(connectionId),
      sender: new Types.ObjectId(userId),
      status: 'PENDING',
    });

    if (!connection) {
      throw new AppError('Pending connection request not found or cannot be withdrawn.', 404);
    }

    connection.status = 'WITHDRAWN';
    await connection.save();

    return connection;
  }

  async cancelConnection(userId: string, connectionId: string): Promise<ISkillConnection> {
    const connection = await SkillConnectionModel.findOne({
      _id: new Types.ObjectId(connectionId),
      $or: [{ sender: new Types.ObjectId(userId) }, { receiver: new Types.ObjectId(userId) }],
      status: 'ACCEPTED',
    });

    if (!connection) {
      throw new AppError('Active connection not found.', 404);
    }

    connection.status = 'CANCELLED';
    connection.cancelledBy = new Types.ObjectId(userId);
    await connection.save();

    return connection;
  }

  async getUserConnections(userId: string): Promise<{
    activeConnections: ISkillConnection[];
    receivedRequests: ISkillConnection[];
    sentRequests: ISkillConnection[];
  }> {
    const uId = new Types.ObjectId(userId);

    const [activeConnections, receivedRequests, sentRequests] = await Promise.all([
      SkillConnectionModel.find({
        $or: [{ sender: uId }, { receiver: uId }],
        status: 'ACCEPTED',
      })
        .populate('sender receiver skill')
        .sort({ updatedAt: -1 }),

      SkillConnectionModel.find({
        receiver: uId,
        status: 'PENDING',
      })
        .populate('sender skill')
        .sort({ createdAt: -1 }),

      SkillConnectionModel.find({
        sender: uId,
        status: 'PENDING',
      })
        .populate('receiver skill')
        .sort({ createdAt: -1 }),
    ]);

    return {
      activeConnections,
      receivedRequests,
      sentRequests,
    };
  }

  /**
   * 6. LEARNING SESSIONS
   */
  async proposeSession(userId: string, data: {
    connectionId: string;
    sessionTitle: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    mode: 'ONLINE' | 'OFFLINE';
    meetingLink?: string;
    location?: string;
  }): Promise<ILearningSession> {
    const connection = await SkillConnectionModel.findOne({
      _id: new Types.ObjectId(data.connectionId),
      $or: [{ sender: new Types.ObjectId(userId) }, { receiver: new Types.ObjectId(userId) }],
      status: 'ACCEPTED',
    });

    if (!connection) {
      throw new AppError('Active connection required to schedule a learning session.', 400);
    }

    // Validate times
    if (data.startTime >= data.endTime) {
      throw new AppError('Session end time must be after start time.', 400);
    }

    // Teacher is either sender or receiver
    const partnerId = connection.sender.toString() === userId ? connection.receiver : connection.sender;

    const session = await LearningSessionModel.create({
      connection: connection._id,
      skill: connection.skill,
      teacher: new Types.ObjectId(userId), // Proposer acts as session leader or can be configured
      learners: [partnerId],
      sessionTitle: data.sessionTitle.trim(),
      description: data.description?.trim(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      mode: data.mode,
      meetingLink: data.mode === 'ONLINE' ? data.meetingLink?.trim() : undefined,
      location: data.mode === 'OFFLINE' ? data.location?.trim() : undefined,
      status: 'PROPOSED',
      proposedBy: new Types.ObjectId(userId),
    });

    // Notify partner
    const proposer = await User.findById(userId);
    await Notification.create({
      recipient: partnerId,
      type: 'LEARN_TEACH_SESSION_PROPOSED',
      title: 'New Learning Session Proposed 📅',
      message: `${proposer?.fullName} proposed a session: "${data.sessionTitle}" on ${data.date} at ${data.startTime}.`,
      metadata: { sessionId: session._id, connectionId: connection._id },
    }).catch(() => {});

    emitToUser(partnerId.toString(), 'learn_teach:session_proposed', {
      sessionId: session._id,
      sessionTitle: session.sessionTitle,
      date: session.date,
      startTime: session.startTime,
    });

    return session;
  }

  async acceptSession(userId: string, sessionId: string): Promise<ILearningSession> {
    const session = await LearningSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      status: 'PROPOSED',
      $or: [{ teacher: new Types.ObjectId(userId) }, { learners: new Types.ObjectId(userId) }],
      proposedBy: { $ne: new Types.ObjectId(userId) },
    });

    if (!session) {
      throw new AppError('Proposed session not found or unauthorized to accept.', 404);
    }

    session.status = 'CONFIRMED';
    await session.save();

    // Notify proposer
    await Notification.create({
      recipient: session.proposedBy,
      type: 'LEARN_TEACH_SESSION_CONFIRMED',
      title: 'Session Confirmed! 🚀',
      message: `Your learning session "${session.sessionTitle}" on ${session.date} has been confirmed.`,
      metadata: { sessionId: session._id },
    }).catch(() => {});

    emitToUser(session.proposedBy.toString(), 'learn_teach:session_confirmed', {
      sessionId: session._id,
      sessionTitle: session.sessionTitle,
    });

    return session;
  }

  async completeSession(userId: string, sessionId: string): Promise<ILearningSession> {
    const session = await LearningSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      status: 'CONFIRMED',
      $or: [{ teacher: new Types.ObjectId(userId) }, { learners: new Types.ObjectId(userId) }],
    });

    if (!session) {
      throw new AppError('Confirmed session not found.', 404);
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    await session.save();

    // Increment progress counter for learners
    for (const learnerId of session.learners) {
      await SkillProgressModel.findOneAndUpdate(
        { user: learnerId, skill: session.skill },
        { $inc: { completedSessionsCount: 1 } }
      ).catch(() => {});
    }

    return session;
  }

  async cancelSession(userId: string, sessionId: string, reason?: string): Promise<ILearningSession> {
    const session = await LearningSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      status: { $in: ['PROPOSED', 'CONFIRMED'] },
      $or: [{ teacher: new Types.ObjectId(userId) }, { learners: new Types.ObjectId(userId) }],
    });

    if (!session) {
      throw new AppError('Session not found.', 404);
    }

    session.status = 'CANCELLED';
    session.cancellationReason = reason?.trim();
    await session.save();

    return session;
  }

  async getUserSessions(userId: string): Promise<ILearningSession[]> {
    const uId = new Types.ObjectId(userId);
    return LearningSessionModel.find({
      $or: [{ teacher: uId }, { learners: uId }],
    })
      .populate('skill teacher learners')
      .sort({ date: -1, startTime: -1 });
  }

  /**
   * 7. GROUP LEARNING
   */
  async createLearningGroup(userId: string, data: {
    skillName: string;
    category: string;
    name: string;
    description: string;
    maxMembers?: number;
    mode?: 'ONLINE' | 'OFFLINE' | 'BOTH';
    languages?: string[];
    schedule?: string;
  }): Promise<ILearningGroup> {
    const skill = await this.getOrCreateSkill(data.skillName, data.category, userId);

    const group = await LearningGroupModel.create({
      creator: new Types.ObjectId(userId),
      skill: skill._id,
      name: data.name.trim(),
      description: data.description.trim(),
      maxMembers: data.maxMembers || 15,
      mode: data.mode || 'BOTH',
      languages: data.languages || ['English', 'Hindi'],
      schedule: data.schedule?.trim(),
      status: 'ACTIVE',
      memberCount: 1,
    });

    // Add creator as GROUP_ADMIN
    await GroupMembershipModel.create({
      group: group._id,
      user: new Types.ObjectId(userId),
      role: 'GROUP_ADMIN',
      status: 'ACCEPTED',
    });

    return group;
  }

  async listLearningGroups(search?: string, skillId?: string): Promise<ILearningGroup[]> {
    const query: any = { status: 'ACTIVE' };

    if (skillId) {
      query.skill = new Types.ObjectId(skillId);
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    return LearningGroupModel.find(query).populate('skill creator').sort({ createdAt: -1 });
  }

  async joinGroup(userId: string, groupId: string, message?: string): Promise<IGroupMembership> {
    const group = await LearningGroupModel.findOne({ _id: new Types.ObjectId(groupId), status: 'ACTIVE' });
    if (!group) {
      throw new AppError('Active learning group not found.', 404);
    }

    const existing = await GroupMembershipModel.findOne({
      group: group._id,
      user: new Types.ObjectId(userId),
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new AppError('You are already a member of this learning group.', 400);
      }
      if (existing.status === 'PENDING') {
        throw new AppError('Your join request is already pending group admin review.', 400);
      }
      existing.status = 'PENDING';
      existing.joinMessage = message?.trim();
      await existing.save();
      return existing;
    }

    const membership = await GroupMembershipModel.create({
      group: group._id,
      user: new Types.ObjectId(userId),
      role: 'GROUP_MEMBER',
      status: 'PENDING',
      joinMessage: message?.trim(),
    });

    return membership;
  }

  async manageGroupMemberStatus(adminId: string, membershipId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<IGroupMembership> {
    const membership = await GroupMembershipModel.findById(membershipId).populate('group');
    if (!membership) {
      throw new AppError('Membership request not found.', 404);
    }

    const group = membership.group as any as ILearningGroup;
    if (group.creator.toString() !== adminId) {
      throw new AppError('Only the group admin can review join requests.', 403);
    }

    membership.status = status;
    await membership.save();

    if (status === 'ACCEPTED') {
      await LearningGroupModel.findByIdAndUpdate(group._id, { $inc: { memberCount: 1 } });
    }

    return membership;
  }

  /**
   * 8. PRIVATE & GROUP CHAT MESSAGES
   */
  async sendMessage(userId: string, data: {
    connectionId?: string;
    groupId?: string;
    content: string;
  }): Promise<ILearningMessage> {
    if (!data.connectionId && !data.groupId) {
      throw new AppError('Either connectionId or groupId must be provided.', 400);
    }

    const content = data.content.trim();
    if (!content) {
      throw new AppError('Message content cannot be empty.', 400);
    }

    // 1. Connection check
    if (data.connectionId) {
      const connection = await SkillConnectionModel.findOne({
        _id: new Types.ObjectId(data.connectionId),
        $or: [{ sender: new Types.ObjectId(userId) }, { receiver: new Types.ObjectId(userId) }],
        status: 'ACCEPTED',
      });

      if (!connection) {
        throw new AppError('Unauthorized: Can only message within an accepted active connection.', 403);
      }

      const message = await LearningMessageModel.create({
        connection: connection._id,
        sender: new Types.ObjectId(userId),
        content,
        isRead: false,
      });

      const recipientId = connection.sender.toString() === userId ? connection.receiver : connection.sender;
      const messagePayload = {
        messageId: message._id,
        connectionId: connection._id,
        senderId: userId,
        content,
        createdAt: message.createdAt,
      };
      emitToUser(recipientId.toString(), 'learn_teach:message_new', messagePayload);
      emitToConnection(connection._id.toString(), 'learn_teach:message_new', messagePayload);

      return message;
    }

    // 2. Group check
    if (data.groupId) {
      const membership = await GroupMembershipModel.findOne({
        group: new Types.ObjectId(data.groupId),
        user: new Types.ObjectId(userId),
        status: 'ACCEPTED',
      });

      if (!membership) {
        throw new AppError('Unauthorized: Must be an accepted member to post messages in this group.', 403);
      }

      const message = await LearningMessageModel.create({
        group: new Types.ObjectId(data.groupId),
        sender: new Types.ObjectId(userId),
        content,
        isRead: false,
      });

      emitToGroup(data.groupId, 'learn_teach:group_message_new', {
        messageId: message._id,
        groupId: data.groupId,
        senderId: userId,
        content,
        createdAt: message.createdAt,
      });

      return message;
    }

    throw new AppError('Invalid messaging target.', 400);
  }

  async getMessages(userId: string, target: { connectionId?: string; groupId?: string }, limit = 50): Promise<ILearningMessage[]> {
    if (target.connectionId) {
      const connection = await SkillConnectionModel.findOne({
        _id: new Types.ObjectId(target.connectionId),
        $or: [{ sender: new Types.ObjectId(userId) }, { receiver: new Types.ObjectId(userId) }],
        status: 'ACCEPTED',
      });

      if (!connection) {
        throw new AppError('Unauthorized to read connection messages.', 403);
      }

      // Mark messages as read for receiver
      await LearningMessageModel.updateMany(
        {
          connection: connection._id,
          sender: { $ne: new Types.ObjectId(userId) },
          isRead: false,
        },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return LearningMessageModel.find({ connection: connection._id })
        .populate('sender', 'fullName email role')
        .sort({ createdAt: 1 })
        .limit(limit);
    }

    if (target.groupId) {
      const membership = await GroupMembershipModel.findOne({
        group: new Types.ObjectId(target.groupId),
        user: new Types.ObjectId(userId),
        status: 'ACCEPTED',
      });

      if (!membership) {
        throw new AppError('Unauthorized to read group messages.', 403);
      }

      return LearningMessageModel.find({ group: new Types.ObjectId(target.groupId) })
        .populate('sender', 'fullName email role')
        .sort({ createdAt: 1 })
        .limit(limit);
    }

    return [];
  }

  /**
   * 9. LEARNING PROGRESS & REVIEWS
   */
  async getUserProgress(userId: string): Promise<ISkillProgress[]> {
    return SkillProgressModel.find({ user: new Types.ObjectId(userId) })
      .populate('skill')
      .sort({ updatedAt: -1 });
  }

  async toggleMilestone(userId: string, progressId: string, milestoneId: string): Promise<ISkillProgress> {
    const progress = await SkillProgressModel.findOne({
      _id: new Types.ObjectId(progressId),
      user: new Types.ObjectId(userId),
    });

    if (!progress) {
      throw new AppError('Progress record not found.', 404);
    }

    const milestone = progress.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found.', 404);
    }

    milestone.completed = !milestone.completed;
    milestone.completedAt = milestone.completed ? new Date() : undefined;

    // Check if all milestones are completed
    progress.isCompleted = progress.milestones.every((m) => m.completed);
    progress.completedAt = progress.isCompleted ? new Date() : undefined;

    await progress.save();
    return progress;
  }

  async createReview(reviewerId: string, data: {
    sessionId: string;
    rating: number;
    feedback: string;
  }): Promise<ILearningReview> {
    const session = await LearningSessionModel.findOne({
      _id: new Types.ObjectId(data.sessionId),
      status: 'COMPLETED',
      $or: [{ teacher: new Types.ObjectId(reviewerId) }, { learners: new Types.ObjectId(reviewerId) }],
    });

    if (!session) {
      throw new AppError('Only participants of completed sessions can submit reviews.', 400);
    }

    // Determine reviewed user: If reviewer is teacher, reviewed is first learner; if learner, reviewed is teacher
    const reviewedUserId =
      session.teacher.toString() === reviewerId ? session.learners[0] : session.teacher;

    const existingReview = await LearningReviewModel.findOne({
      session: session._id,
      reviewer: new Types.ObjectId(reviewerId),
    });

    if (existingReview) {
      throw new AppError('You have already submitted a review for this session.', 400);
    }

    const review = await LearningReviewModel.create({
      session: session._id,
      reviewer: new Types.ObjectId(reviewerId),
      reviewedUser: reviewedUserId,
      skill: session.skill,
      rating: data.rating,
      feedback: data.feedback.trim(),
    });

    return review;
  }

  /**
   * 10. MODERATION FOUNDATION
   */
  async submitReport(reporterId: string, data: {
    targetType: 'USER' | 'TEACHING_LISTING' | 'LEARNING_GROUP' | 'MESSAGE';
    targetId: string;
    reportedUserId?: string;
    reason: string;
    details?: string;
  }): Promise<void> {
    await LearnTeachReportModel.create({
      reporter: new Types.ObjectId(reporterId),
      targetType: data.targetType,
      targetId: new Types.ObjectId(data.targetId),
      reportedUser: data.reportedUserId ? new Types.ObjectId(data.reportedUserId) : undefined,
      reason: data.reason.trim(),
      details: data.details?.trim(),
      status: 'PENDING',
    });
  }
}

export const learnTeachService = new LearnTeachService();
