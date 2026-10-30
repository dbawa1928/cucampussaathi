import { Router } from 'express';
import { learnTeachController } from '../controllers/learnTeachController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// Skills catalogue (public to authenticated users)
router.get('/skills/categories', learnTeachController.getSkillCategories.bind(learnTeachController));
router.get('/skills', learnTeachController.getSkills.bind(learnTeachController));

// All subsequent routes require authenticated user session
router.use(authGuard);

// Dashboard overview
router.get('/dashboard', learnTeachController.getDashboardOverview.bind(learnTeachController));
router.get('/dashboard-stats', learnTeachController.getDashboardOverview.bind(learnTeachController));

// Recommendations & Discovery
router.get('/recommendations', learnTeachController.getRecommendations.bind(learnTeachController));
router.get('/discover', learnTeachController.discoverPeople.bind(learnTeachController));

// Teaching Listings (Support both /teaching and /teaching-listings aliases)
router.post('/teaching', learnTeachController.createTeachingListing.bind(learnTeachController));
router.post('/teaching-listings', learnTeachController.createTeachingListing.bind(learnTeachController));
router.get('/teaching/mine', learnTeachController.getMyTeachingListings.bind(learnTeachController));
router.get('/teaching-listings/my', learnTeachController.getMyTeachingListings.bind(learnTeachController));
router.get('/teaching-listings', learnTeachController.getMyTeachingListings.bind(learnTeachController));
router.put('/teaching-listings/:id', learnTeachController.updateTeachingListing.bind(learnTeachController));
router.patch('/teaching-listings/:id', learnTeachController.updateTeachingListing.bind(learnTeachController));
router.patch('/teaching/:id', learnTeachController.updateTeachingListing.bind(learnTeachController));
router.delete('/teaching-listings/:id', learnTeachController.deleteTeachingListing.bind(learnTeachController));
router.delete('/teaching/:id', learnTeachController.deleteTeachingListing.bind(learnTeachController));

// Learning Goals (Support both /goals and /learning-goals aliases)
router.post('/goals', learnTeachController.createLearningGoal.bind(learnTeachController));
router.post('/learning-goals', learnTeachController.createLearningGoal.bind(learnTeachController));
router.get('/goals/mine', learnTeachController.getMyLearningGoals.bind(learnTeachController));
router.get('/learning-goals/my', learnTeachController.getMyLearningGoals.bind(learnTeachController));
router.get('/learning-goals', learnTeachController.getMyLearningGoals.bind(learnTeachController));
router.put('/learning-goals/:id', learnTeachController.updateLearningGoal.bind(learnTeachController));
router.patch('/learning-goals/:id', learnTeachController.updateLearningGoal.bind(learnTeachController));
router.patch('/goals/:id', learnTeachController.updateLearningGoal.bind(learnTeachController));
router.delete('/learning-goals/:id', learnTeachController.deleteLearningGoal.bind(learnTeachController));
router.delete('/goals/:id', learnTeachController.deleteLearningGoal.bind(learnTeachController));

// Connections
router.get('/connections', learnTeachController.getConnections.bind(learnTeachController));
router.post('/connections', learnTeachController.sendConnectionRequest.bind(learnTeachController));
router.patch('/connections/:id/status', learnTeachController.handleConnectionStatus.bind(learnTeachController));
router.post('/connections/:id/accept', learnTeachController.acceptConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/reject', learnTeachController.rejectConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/withdraw', learnTeachController.withdrawConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/cancel', learnTeachController.cancelConnection.bind(learnTeachController));

// Learning Sessions
router.get('/sessions', learnTeachController.getSessions.bind(learnTeachController));
router.post('/sessions', learnTeachController.proposeSession.bind(learnTeachController));
router.patch('/sessions/:id/status', learnTeachController.handleSessionStatus.bind(learnTeachController));
router.post('/sessions/:id/accept', learnTeachController.acceptSession.bind(learnTeachController));
router.post('/sessions/:id/complete', learnTeachController.completeSession.bind(learnTeachController));
router.post('/sessions/:id/cancel', learnTeachController.cancelSession.bind(learnTeachController));

// Groups
router.get('/groups', learnTeachController.getGroups.bind(learnTeachController));
router.post('/groups', learnTeachController.createGroup.bind(learnTeachController));
router.post('/groups/:id/join', learnTeachController.joinGroup.bind(learnTeachController));
router.post('/groups/:id/leave', learnTeachController.leaveGroup.bind(learnTeachController));
router.post('/groups/memberships/:id', learnTeachController.manageGroupMember.bind(learnTeachController));

// Messages & Chat
router.get('/messages', learnTeachController.getMessages.bind(learnTeachController));
router.post('/messages', learnTeachController.sendMessage.bind(learnTeachController));

// Progress & Milestones
router.get('/progress', learnTeachController.getProgress.bind(learnTeachController));
router.post('/progress', learnTeachController.createProgress.bind(learnTeachController));
router.patch('/progress/:id/milestone', learnTeachController.toggleMilestoneByIndex.bind(learnTeachController));
router.patch('/progress/:id/milestones/:milestoneId', learnTeachController.toggleMilestone.bind(learnTeachController));

// Reviews & Moderation
router.get('/reviews/user/:userId', learnTeachController.getUserReviews.bind(learnTeachController));
router.post('/reviews', learnTeachController.createReview.bind(learnTeachController));
router.post('/reports', learnTeachController.submitReport.bind(learnTeachController));

export default router;
