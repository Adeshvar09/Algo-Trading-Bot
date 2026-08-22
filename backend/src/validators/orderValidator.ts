import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHandler';

export function validateOrderInput(req: Request, res: Response, next: NextFunction) {
  const { symbol, order_type, quantity } = req.body;

  if (!symbol || !order_type || !quantity) {
    return sendError(res, 'Missing required fields: symbol, order_type, quantity');
  }

  const cleanType = (order_type as string).toUpperCase().trim();
  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty <= 0) {
    return sendError(res, 'Quantity must be a positive integer');
  }

  if (cleanType !== 'BUY' && cleanType !== 'SELL') {
    return sendError(res, 'Order type must be BUY or SELL');
  }

  next();
}
