import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { sendResponse, sendError } from '../utils/responseHandler';

export class ChatController {
  static async handleChat(req: Request, res: Response) {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return sendError(res, 'Please provide a valid text question');
    }

    try {
      const response = await ChatService.processMessage(message);
      return sendResponse(res, response);
    } catch (err) {
      console.error('Error in chatbot:', err);
      return sendError(res, 'Failed to process chat query', 500);
    }
  }
}
