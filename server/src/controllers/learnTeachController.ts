import { Request, Response, NextFunction } from 'express';
import { learnTeachService } from '../services/learnTeachService';
import { recommendationEngine } from '../services/recommendationEngine';
import {
  createTeachingListingSchema,
  updateTeachingListingSchema,
  createLearningGoalSchema,
  updateLearningGoalSchema,
  sendConnectionRequestSchema,
  proposeSessionSchema,
  createLearningGroupSchema,
  sendMessageSchema,
  createReviewSchema,
  submitReportSchema,
} from '../validators/learnTeachValidators';

export class LearnTeachController {
  /**
   * GET /api/v1/learn-teach/skills
   */
  async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const skills = await learnTeachService.listSkills(search, category);
      res.json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/learn-teach/dashboard
   */
  async getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      const [teachingListings, learningGoals, connections, sessions, progressList, recommendations] =
        await Promise.all([
          learnTeachService.getUserTeachingListings(userId),
          learnTeachService.getUserLearningGoals(userId),
          learnTeachService.getUserConnections(userId),
          learnTeachService.getUserSessions(userId),
          learnTeachService.getUserProgress(userId),
          recommendationEngine.getRecommendationsForUser(userId, 4),
        ]);

      const upcomingSessions = sessions.filter(
        (s) => s.status === 'CONFIRMED' && s.date >= new Date().toISOString().split('T')[0]
      );
      const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

      res.json({
        success: true,
        data: {
          stats: {
            teachingSkillsCount: teachingListings.filter((l) => l.status === 'ACTIVE').length,
            learningGoalsCount: learningGoals.filter((g) => g.status === 'ACTIVE').length,
            activeConnectionsCount: connections.activeConnections.length,
            pendingReceivedRequestsCount: connections.receivedRequests.length,
            upcomingSessionsCount: upcomingSessions.length,
            completedSessionsCount: completedSessions.length,
          },
          teachingListings: teachingListings.slice(0, 5),
          learningGoals: learningGoals.slice(0, 5),
          activeConnections: connections.activeConnections.slice(0, 5),
          receivedRequests: connections.receivedRequests.slice(0, 5),
          upcomingSessions: upcomingSessions.slice(0, 3),
          progress: progressList.slice(0, 5),
          recommendations,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/learn-teach/recommendations
   */
  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const limit = Number(req.query.limit) || 10;
      const recommendations = await recommendationEngine.getRecommendationsForUser(userId, limit);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/learn-teach/discover
   */
  async discoverPeople(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?._id?.toString();
      const result = await learnTeachService.discoverPeople({
        currentUserId,
        skill: req.query.skill as string | undefined,
        role: req.query.role as any,
        department: req.query.department as string | undefined,
        teachingMode: req.query.teachingMode as any,
        expertiseLevel: req.query.expertiseLevel as string | undefined,
        language: req.query.language as string | undefined,
        search: req.query.search as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 12,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TEACHING LISTINGS CRUD
   */
  async createTeachingListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = createTeachingListingSchema.parse(req.body);
      const listing = await learnTeachService.createTeachingListing(userId, validated);
      res.status(201).json({ success: true, message: 'Teaching skill listed successfully.', data: listing });
    } catch (error) {
      next(error);
    }
  }

  async getMyTeachingListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const listings = await learnTeachService.getUserTeachingListings(userId);
      res.json({ success: true, data: listings });
    } catch (error) {
      next(error);
    }
  }

  async updateTeachingListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const listingId = req.params.id;
      const validated = updateTeachingListingSchema.parse(req.body);
      const updated = await learnTeachService.updateTeachingListing(userId, listingId, validated as any);
      res.json({ success: true, message: 'Teaching listing updated.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  async deleteTeachingListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await learnTeachService.deleteTeachingListing(userId, req.params.id);
      res.json({ success: true, message: 'Teaching listing removed.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * LEARNING GOALS CRUD
   */
  async createLearningGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = createLearningGoalSchema.parse(req.body);
      const goal = await learnTeachService.createLearningGoal(userId, validated);
      res.status(201).json({ success: true, message: 'Learning goal saved successfully.', data: goal });
    } catch (error) {
      next(error);
    }
  }

  async getMyLearningGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const goals = await learnTeachService.getUserLearningGoals(userId);
      res.json({ success: true, data: goals });
    } catch (error) {
      next(error);
    }
  }

  async updateLearningGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const goalId = req.params.id;
      const validated = updateLearningGoalSchema.parse(req.body);
      const updated = await learnTeachService.updateLearningGoal(userId, goalId, validated as any);
      res.json({ success: true, message: 'Learning goal updated.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  async deleteLearningGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await learnTeachService.deleteLearningGoal(userId, req.params.id);
      res.json({ success: true, message: 'Learning goal removed.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * CONNECTIONS LIFECYCLE
   */
  async getConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const result = await learnTeachService.getUserConnections(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async sendConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = sendConnectionRequestSchema.parse(req.body);
      const conn = await learnTeachService.sendConnectionRequest(userId, validated);
      res.status(201).json({ success: true, message: 'Connection request sent successfully.', data: conn });
    } catch (error) {
      next(error);
    }
  }

  async acceptConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const conn = await learnTeachService.acceptConnectionRequest(userId, req.params.id);
      res.json({ success: true, message: 'Connection accepted. You can now chat and schedule learning sessions!', data: conn });
    } catch (error) {
      next(error);
    }
  }

  async rejectConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const reason = req.body.reason as string | undefined;
      const conn = await learnTeachService.rejectConnectionRequest(userId, req.params.id, reason);
      res.json({ success: true, message: 'Connection request rejected.', data: conn });
    } catch (error) {
      next(error);
    }
  }

  async withdrawConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const conn = await learnTeachService.withdrawConnectionRequest(userId, req.params.id);
      res.json({ success: true, message: 'Connection request withdrawn.', data: conn });
    } catch (error) {
      next(error);
    }
  }

  async cancelConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const conn = await learnTeachService.cancelConnection(userId, req.params.id);
      res.json({ success: true, message: 'Connection cancelled.', data: conn });
    } catch (error) {
      next(error);
    }
  }

  /**
   * LEARNING SESSIONS
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const sessions = await learnTeachService.getUserSessions(userId);
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async proposeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = proposeSessionSchema.parse(req.body);
      const session = await learnTeachService.proposeSession(userId, validated);
      res.status(201).json({ success: true, message: 'Learning session proposed.', data: session });
    } catch (error) {
      next(error);
    }
  }

  async acceptSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const session = await learnTeachService.acceptSession(userId, req.params.id);
      res.json({ success: true, message: 'Learning session confirmed!', data: session });
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const session = await learnTeachService.completeSession(userId, req.params.id);
      res.json({ success: true, message: 'Session marked as completed. You may now leave a review.', data: session });
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const reason = req.body.reason as string | undefined;
      const session = await learnTeachService.cancelSession(userId, req.params.id, reason);
      res.json({ success: true, message: 'Session cancelled.', data: session });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GROUPS & MEMBERSHIPS
   */
  async getGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const skillId = req.query.skillId as string | undefined;
      const groups = await learnTeachService.listLearningGroups(search, skillId);
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = createLearningGroupSchema.parse(req.body);
      const group = await learnTeachService.createLearningGroup(userId, validated);
      res.status(201).json({ success: true, message: 'Learning group created.', data: group });
    } catch (error) {
      next(error);
    }
  }

  async joinGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const message = req.body.message as string | undefined;
      const membership = await learnTeachService.joinGroup(userId, req.params.id, message);
      res.json({ success: true, message: 'Group join request submitted.', data: membership });
    } catch (error) {
      next(error);
    }
  }

  async manageGroupMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const status = req.body.status as 'ACCEPTED' | 'REJECTED';
      const membership = await learnTeachService.manageGroupMemberStatus(userId, req.params.id, status);
      res.json({ success: true, message: `Membership status updated to ${status}.`, data: membership });
    } catch (error) {
      next(error);
    }
  }

  /**
   * MESSAGES & CHAT
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const connectionId = req.query.connectionId as string | undefined;
      const groupId = req.query.groupId as string | undefined;
      const limit = Number(req.query.limit) || 50;
      const messages = await learnTeachService.getMessages(userId, { connectionId, groupId }, limit);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = sendMessageSchema.parse(req.body);
      const message = await learnTeachService.sendMessage(userId, validated);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PROGRESS & MILESTONES
   */
  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const progress = await learnTeachService.getUserProgress(userId);
      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  }

  async toggleMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const progressId = req.params.id;
      const milestoneId = req.params.milestoneId;
      const progress = await learnTeachService.toggleMilestone(userId, progressId, milestoneId);
      res.json({ success: true, message: 'Milestone updated.', data: progress });
    } catch (error) {
      next(error);
    }
  }

  /**
   * REVIEWS
   */
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = createReviewSchema.parse(req.body);
      const review = await learnTeachService.createReview(userId, validated);
      res.status(201).json({ success: true, message: 'Review submitted successfully. Thank you!', data: review });
    } catch (error) {
      next(error);
    }
  }

  /**
   * MODERATION REPORTS
   */
  async submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validated = submitReportSchema.parse(req.body);
      await learnTeachService.submitReport(userId, validated);
      res.status(201).json({ success: true, message: 'Report submitted. Our moderation team will review this.' });
    } catch (error) {
      next(error);
    }
  }
}

export const learnTeachController = new LearnTeachController();
