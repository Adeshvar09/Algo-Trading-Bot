import { Request, Response } from 'express';
import { query } from '../db';
import { generateAlgorithmSignal } from '../services/algorithmService';
import { sendResponse, sendError } from '../utils/responseHandler';
import { config } from '../config/env.config';

export class WatchlistController {
  static async getWatchlist(_req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT w.id, w.symbol, s.name, s.current_price 
         FROM watchlist w 
         JOIN stocks s ON UPPER(w.symbol) = UPPER(s.symbol) 
         WHERE w.user_id = $1`,
        [config.defaultUserId]
      );

      const watchlistData = await Promise.all(result.rows.map(async (item) => {
        const priceRes = await query(
          'SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY price_date ASC',
          [item.symbol]
        );
        const signalData = generateAlgorithmSignal(item.symbol, priceRes.rows);
        return {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          current_price: parseFloat(item.current_price),
          signal: signalData.signal,
          score: signalData.score,
          confidence: signalData.confidence
        };
      }));

      return sendResponse(res, watchlistData);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      return sendError(res, 'Failed to fetch watchlist', 500);
    }
  }

  static async addToWatchlist(req: Request, res: Response) {
    try {
      const { symbol } = req.body;
      if (!symbol) return sendError(res, 'Stock symbol is required');

      const cleanSymbol = (symbol as string).toUpperCase().trim();
      const stockRes = await query('SELECT * FROM stocks WHERE symbol = $1', [cleanSymbol]);
      if (stockRes.rows.length === 0) {
        return sendError(res, `Invalid stock symbol '${cleanSymbol}'`, 404);
      }

      const stock = stockRes.rows[0];

      const checkRes = await query(
        'SELECT * FROM watchlist WHERE user_id = $1 AND UPPER(symbol) = $2',
        [config.defaultUserId, cleanSymbol]
      );

      if (checkRes.rows.length > 0) {
        return sendError(res, `${cleanSymbol} is already in your watchlist`);
      }

      await query(
        'INSERT INTO watchlist (user_id, stock_id, symbol) VALUES ($1, $2, $3)',
        [config.defaultUserId, stock.id, cleanSymbol]
      );

      return sendResponse(res, { message: `${cleanSymbol} added to watchlist successfully` });
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      return sendError(res, 'Failed to add stock to watchlist', 500);
    }
  }

  static async removeFromWatchlist(req: Request, res: Response) {
    try {
      const symbol = (req.params.symbol as string).toUpperCase().trim();
      await query(
        'DELETE FROM watchlist WHERE user_id = $1 AND UPPER(symbol) = $2',
        [config.defaultUserId, symbol]
      );

      return sendResponse(res, { message: `${symbol} removed from watchlist successfully` });
    } catch (err) {
      console.error('Error deleting from watchlist:', err);
      return sendError(res, 'Failed to remove stock from watchlist', 500);
    }
  }
}
