import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();

router.post('/', ChatController.handleChat);

export default router;
