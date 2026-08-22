import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolioService';
import { sendResponse, sendError } from '../utils/responseHandler';

export class OrderController {
  static async executeOrder(req: Request, res: Response) {
    const { symbol, order_type, quantity } = req.body;
    try {
      const result = await PortfolioService.executeOrder(symbol, order_type, quantity);
      return sendResponse(res, result);
    } catch (err: any) {
      console.error('Error processing order:', err);
      return sendError(res, err.message || 'Order processing failed', 400);
    }
  }
}
