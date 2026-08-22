import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolioService';
import { sendResponse, sendError } from '../utils/responseHandler';

export class PortfolioController {
  static async getPortfolio(_req: Request, res: Response) {
    try {
      const portfolio = await PortfolioService.getPortfolio();
      return sendResponse(res, portfolio);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      return sendError(res, 'Failed to fetch portfolio', 500);
    }
  }

  static async getTransactions(_req: Request, res: Response) {
    try {
      const txs = await PortfolioService.getTransactions();
      return sendResponse(res, txs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return sendError(res, 'Failed to fetch transactions', 500);
    }
  }
}
