import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.utils';

export function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new Error('Route not found');

  logger.error(error);
  res.status(404).json({ error: error.message });
}
