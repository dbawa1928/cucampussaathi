import { Router } from 'express';
import { aiTutorController } from '../controllers/aiTutorController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// Ask grounded question on uploaded document
router.post(
  '/documents/:id/chat',
  authGuard,
  aiTutorController.chat.bind(aiTutorController)
);

// Generate document summary (short, detailed, key_concepts, exam_notes)
router.post(
  '/documents/:id/summarize',
  authGuard,
  aiTutorController.summarize.bind(aiTutorController)
);

// List conversations for a document
router.get(
  '/documents/:id/conversations',
  authGuard,
  aiTutorController.listConversations.bind(aiTutorController)
);

// Get specific conversation messages
router.get(
  '/conversations/:conversationId',
  authGuard,
  aiTutorController.getConversation.bind(aiTutorController)
);

// Delete a conversation thread
router.delete(
  '/conversations/:conversationId',
  authGuard,
  aiTutorController.deleteConversation.bind(aiTutorController)
);

export default router;
