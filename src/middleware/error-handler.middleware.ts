import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { ApiErrorResponse } from '../domain/api-responses';
import { HttpError } from '../errors/http-errors';
import { errors } from '../utils/constants';
import { rootLogger } from '../utils/logger';

const logger = rootLogger.child({ context: 'ErrorHandlerMiddleware' });

export function appErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(
    'Error thrown for %s %s',
    req.method, req.url, { error: err.stack }
  );
  const isProduction = process.env.NODE_ENV === 'production';
  let errMessage = err.message;

  if (err instanceof HttpError) {
    if (isProduction && err.statusCode === 500) {
      errMessage = config.messages.serverError;
    }
    return res.status(err.statusCode).json({
      error: err.name, 
      message: errMessage,
      details: err.details,
    } as ApiErrorResponse);
  } else if (err.name === 'UnauthorizedError') {
    // permissions middleware error
    return res.status(403).json({
      error: errors.FORBIDDEN,
      message: config.messages.permissionError,
      details: []
    });
  }

  if (isProduction) {
    errMessage = config.messages.serverError;
  }
  
  res.status(500).json({
    error: errors.SERVER_ERROR, message: errMessage, details: [],
  } as ApiErrorResponse);
}