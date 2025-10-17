import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info(`📥 ${req.method} ${req.path}`, {
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`📤 ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      duration,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
};