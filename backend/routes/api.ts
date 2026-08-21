import { Router, Request, Response } from 'express';
import { healthHandler } from '../controllers/healthController';
import { chatHandler } from '../controllers/chatController';
import { generateImageHandler } from '../controllers/imageController';
import { codexHandler } from '../controllers/codexController';
import {
  listConversationsHandler,
  getConversationHandler,
  createConversationHandler,
  updateConversationHandler,
  deleteConversationHandler,
  listMessagesHandler,
  createMessageHandler,
} from '../controllers/conversationController';
import {
  listMemoriesHandler,
  getMemoryHandler,
  createMemoryHandler,
  updateMemoryHandler,
  deleteMemoryHandler,
  deleteAllMemoriesHandler,
  memoryStatsHandler,
  migrateMemoriesHandler,
  memorySearchHandler,
  userUnderstandingHandler,
  communicationStyleHandler,
  preferencesHandler,
  learningEventsHandler,
} from '../controllers/memoryController';

const router = Router();

// Health check is registered in backend/index.ts before auth middleware
// to allow load balancer probes without authentication
router.post('/chat', chatHandler);
router.post('/generate-image', generateImageHandler);
router.post('/codex/execute', codexHandler);

router.get('/conversations', listConversationsHandler);
router.post('/conversations', createConversationHandler);
router.get('/conversations/:id', getConversationHandler);
router.patch('/conversations/:id', updateConversationHandler);
router.delete('/conversations/:id', deleteConversationHandler);
router.get('/conversations/:id/messages', listMessagesHandler);
router.post('/conversations/:id/messages', createMessageHandler);

router.get('/memories', listMemoriesHandler);
router.get('/memories/search', memorySearchHandler);
router.get('/memories/stats', memoryStatsHandler);
router.post('/memories', createMemoryHandler);
router.post('/memories/migrate', migrateMemoriesHandler);
router.get('/memories/:id', getMemoryHandler);
router.patch('/memories/:id', updateMemoryHandler);
router.delete('/memories/:id', deleteMemoryHandler);
router.delete('/memories', deleteAllMemoriesHandler);

router.get('/user-understanding', userUnderstandingHandler);
router.get('/communication-style', communicationStyleHandler);
router.get('/preferences', preferencesHandler);
router.get('/learning-events', learningEventsHandler);
router.get('/memories/:memoryId/learning-events', learningEventsHandler);

router.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

export { router as apiRouter };
