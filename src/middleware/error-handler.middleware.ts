import { NextFunction, Request, Response } from 'express';
import { ApiErrorResponse } from '../domain/api-responses';
import { HttpError } from '../errors/http-errors';
import { errors } from '../utils/constants';
import { rootLogger } from '../utils/logger';

const logger = rootLogger.child({ context: 'ErrorHandlerMiddleware' });

export function appErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('Error thrown for %s %s', req.method, req.url, { error: err.stack });
  let message: string;
  if (process.env.NODE_ENV === 'production') {
    message = 'An error occurred while processing the request';
  } else {
    message = err.message;
  }
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.name, 
      message,
      details: err.details,
    } as ApiErrorResponse);
  }
  
  res.status(500).json({
    error: errors.SERVER_ERROR, message, details: [],
  } as ApiErrorResponse);
}