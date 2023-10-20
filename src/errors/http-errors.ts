import { errors } from '../utils/constants';
import { BaseError } from './base-error';

export class HttpError extends BaseError {
  statusCode: number;
  details: unknown[];

  constructor({
    statusCode, name, message, details, cause
  }: {
        statusCode: number;
        name: string;
        message: string;
        details?: unknown[];
        cause?: unknown;
    }) {
    super({
      name,
      message,
      cause
    });
    this.statusCode = statusCode;
    this.details = details ?? [];
  }
}

export class InputError extends HttpError {
  constructor({
    name, message, cause, details
  }: {
        name?: string;
        message: string;
        cause?: unknown;
        details?: unknown[];
    }) {
    super({
      statusCode: 400,
      name: name ?? 'INPUT_ERROR',
      message,
      details,
      cause
    });
  }
}

export class AlreadyExistsError extends InputError {
  constructor({ message, cause, details }: {
    message: string;
    cause?: unknown;
    details?: unknown[];
  }) {
    super({
      name: errors.ALREADY_EXISTS,
      message,
      details,
      cause
    });
  }
}

export class ForbiddenError extends HttpError {
  constructor({ message }: { message?: string; }) {
    super({
      statusCode: 403,
      name: errors.FORBIDDEN,
      message: message ?? 'Forbidden'
    });
  }
}


export class NotFoundError extends HttpError {
  constructor({
    name, message, cause
  }: {
        name?: string;
        message: string;
        cause?: unknown;
    }) {
    super({
      statusCode: 404,
      name: name ?? 'NOT_FOUND',
      message,
      cause
    });
  }
}

export class InvalidStateError extends HttpError {
  constructor({
    message, cause, name
  }: {
        name?: string;
        message: string;
        cause?: unknown;
    }) {
    super({
      statusCode: 409,
      name: name ?? 'INVALID_STATE',
      message,
      cause
    });
  }
}

export class RequirementNotMetError extends HttpError {
  constructor({
    message, cause, name
  }: {
        name?: string;
        message: string;
        cause?: unknown;
    }) {
    super({
      statusCode: 422,
      name: name ?? 'REQUIREMENT_NOT_MET',
      message,
      cause
    });
  }
}

export class FailedDependencyError extends HttpError {
  constructor({
    message, cause, name
  }: {
        name?: string;
        message: string;
        cause?: unknown;
    }) {
    super({
      statusCode: 424,
      name: name ?? 'DEPENDENCY_FAILED',
      message,
      cause
    });
  }
}

export class ServerError extends HttpError {
  constructor({
    message, cause
  }: {
        message: string;
        cause?: unknown;
    }) {
    super({
      statusCode: 500,
      name: 'SERVER_ERROR',
      message,
      cause
    });
  }
}

export class RecordInUse extends InvalidStateError {
  constructor({
    name, message, cause
  }: {
    name?: string
    message?: string,
    cause?: unknown
  }) {
    super({
      name: name ?? errors.RECORD_IN_USE,
      message: message ?? 'Unauthorized',
      cause
    });
  }
}