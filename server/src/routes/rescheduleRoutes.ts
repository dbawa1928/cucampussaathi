import { Router } from 'express';
import { rescheduleController } from '../controllers/rescheduleController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.post('/:proposalId/accept', rescheduleController.acceptProposal);
router.post('/:proposalId/reject', rescheduleController.rejectProposal);
router.post('/:proposalId/withdraw', rescheduleController.withdrawProposal);

export default router;
