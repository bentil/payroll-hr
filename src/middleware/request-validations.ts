import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import { InputError } from '../errors/http-errors';
import { rootLogger } from '../utils/logger';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'RequestValidation' });

export function validateRequestBody(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(
      req.body, { abortEarly: false }
    );

    if (error) {
      logger.warn('Request body validation failed with error', { error });
      const errorMessages = error.details.map(err => err.message);
      throw new InputError({
        name: errors.REQUEST_VALIDATION_FAILED,
        message: 'Request validation failed',
        details: errorMessages,
      });
    }
    req.body = value;
    next();
  };

}

export function validateRequestQuery(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(
      req.query, { abortEarly: false }
    );

    if (error) {
      logger.warn('Request query validation failed with errors', { error });
      const errorMessages = error.details.map(err => err.message);
      throw new InputError({
        name: errors.REQUEST_VALIDATION_FAILED,
        message: 'Request validation failed',
        details: errorMessages,
      });
    }

    req.query = value;
    next();
  };
}