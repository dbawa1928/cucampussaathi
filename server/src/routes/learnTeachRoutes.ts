import { Router } from 'express';
import { learnTeachController } from '../controllers/learnTeachController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// Skills catalogue
router.get('/skills', learnTeachController.getSkills.bind(learnTeachController));

// All subsequent routes require authenticated user session
router.use(authGuard);

// Dashboard overview
router.get('/dashboard', learnTeachController.getDashboardOverview.bind(learnTeachController));

// Recommendations & Discovery
router.get('/recommendations', learnTeachController.getRecommendations.bind(learnTeachController));
router.get('/discover', learnTeachController.discoverPeople.bind(learnTeachController));

// Teaching Listings
router.post('/teaching', learnTeachController.createTeachingListing.bind(learnTeachController));
router.get('/teaching/mine', learnTeachController.getMyTeachingListings.bind(learnTeachController));
router.patch('/teaching/:id', learnTeachController.updateTeachingListing.bind(learnTeachController));
router.delete('/teaching/:id', learnTeachController.deleteTeachingListing.bind(learnTeachController));

// Learning Goals
router.post('/goals', learnTeachController.createLearningGoal.bind(learnTeachController));
router.get('/goals/mine', learnTeachController.getMyLearningGoals.bind(learnTeachController));
router.patch('/goals/:id', learnTeachController.updateLearningGoal.bind(learnTeachController));
router.delete('/goals/:id', learnTeachController.deleteLearningGoal.bind(learnTeachController));

// Connections
router.get('/connections', learnTeachController.getConnections.bind(learnTeachController));
router.post('/connections', learnTeachController.sendConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/accept', learnTeachController.acceptConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/reject', learnTeachController.rejectConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/withdraw', learnTeachController.withdrawConnectionRequest.bind(learnTeachController));
router.post('/connections/:id/cancel', learnTeachController.cancelConnection.bind(learnTeachController));

// Learning Sessions
router.get('/sessions', learnTeachController.getSessions.bind(learnTeachController));
router.post('/sessions', learnTeachController.proposeSession.bind(learnTeachController));
router.post('/sessions/:id/accept', learnTeachController.acceptSession.bind(learnTeachController));
router.post('/sessions/:id/complete', learnTeachController.completeSession.bind(learnTeachController));
router.post('/sessions/:id/cancel', learnTeachController.cancelSession.bind(learnTeachController));

// Groups
router.get('/groups', learnTeachController.getGroups.bind(learnTeachController));
router.post('/groups', learnTeachController.createGroup.bind(learnTeachController));
router.post('/groups/:id/join', learnTeachController.joinGroup.bind(learnTeachController));
router.post('/groups/memberships/:id', learnTeachController.manageGroupMember.bind(learnTeachController));

// Messages & Chat
router.get('/messages', learnTeachController.getMessages.bind(learnTeachController));
router.post('/messages', learnTeachController.sendMessage.bind(learnTeachController));

// Progress & Milestones
router.get('/progress', learnTeachController.getProgress.bind(learnTeachController));
router.patch('/progress/:id/milestones/:milestoneId', learnTeachController.toggleMilestone.bind(learnTeachController));

// Reviews & Moderation
router.post('/reviews', learnTeachController.createReview.bind(learnTeachController));
router.post('/reports', learnTeachController.submitReport.bind(learnTeachController));

export default router;
