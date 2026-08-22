import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError';
import { sendError } from '../utils/responseHandler';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled Error:', err);

  if (err instanceof CustomError) {
    return sendError(res, err.message, err.statusCode);
  }

  return sendError(res, err.message || 'Internal Server Error', 500);
}
