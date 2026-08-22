import { Request, Response } from 'express';
import { StockService } from '../services/stockService';
import { generateAlgorithmSignal } from '../services/algorithmService';
import { sendResponse, sendError } from '../utils/responseHandler';

export class StockController {
  static async getStocks(_req: Request, res: Response) {
    try {
      const stocks = await StockService.getAllStocks();
      return sendResponse(res, stocks);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      return sendError(res, 'Failed to fetch stocks', 500);
    }
  }

  static async getStockBySymbol(req: Request, res: Response) {
    try {
      const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
      const stock = await StockService.getStockBySymbol(symbol);
      if (!stock) {
        return sendError(res, `Stock symbol '${symbol}' not found`, 404);
      }
      return sendResponse(res, stock);
    } catch (err) {
      console.error('Error fetching stock:', err);
      return sendError(res, 'Failed to fetch stock details', 500);
    }
  }

  static async getStockHistory(req: Request, res: Response) {
    try {
      const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
      const history = await StockService.getStockHistory(symbol);
      return sendResponse(res, history);
    } catch (err) {
      console.error('Error fetching stock history:', err);
      return sendError(res, 'Failed to fetch historical price data', 500);
    }
  }

  static async getStockSignal(req: Request, res: Response) {
    try {
      const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
      const history = await StockService.getStockHistory(symbol);
      if (history.length === 0) {
        return sendError(res, `No price history found for symbol '${symbol}'`, 404);
      }
      const signal = generateAlgorithmSignal(symbol, history);
      return sendResponse(res, signal);
    } catch (err) {
      console.error('Error generating signal:', err);
      return sendError(res, 'Failed to generate algorithmic signal', 500);
    }
  }
}
