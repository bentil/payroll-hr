import { errors } from '../utils/constants';
import { HttpError } from './http-errors';

export class UnauthorizedError extends HttpError {
  constructor({ name, message }: { 
        name?: string;
        message?: string;
    }) {
    super({
      statusCode: 401,
      name: name ?? errors.UNAUTHORIZED,
      message: message ?? 'Unauthorized',
    });
  }
}

export class AccessDeniedError extends UnauthorizedError {
  constructor() {
    super({ message: 'Access denied' });
  }
}
