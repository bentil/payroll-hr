import { NextFunction, Request, RequestHandler, Response } from 'express';
import { isAuthorizedUser } from '../domain/user.domain';
import { ForbiddenError } from '../errors/http-errors';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { rootLogger } from '../utils/logger';

const logger = rootLogger.child({ context: 'AuthMiddleware' });
export function authenticateClient(req: Request, _res: Response, next: NextFunction) {
  const clientAppKey = req.headers['proxy-authorization'];
  if (!clientAppKey || clientAppKey !== process.env.APP_KEY) {
    throw new UnauthorizedError({});
  }
  next();
}

export function authenticateUser(options?: { optional?: boolean }): RequestHandler {
  const optional = options?.optional !== undefined ? options.optional : false;
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req.headers['user-metadata'];
    if (!data) {
      if (!optional) {
        logger.warn('User auth header is missing or blank');
        throw new UnauthorizedError({});
      }
      return next(); // Skip verification if data not present and auth optional
    }

    let userData: any;
    try {
      userData = JSON.parse(data as string);
    } catch (err) {
      logger.warn('Failed to parse user auth header value', { error: err });
      throw new UnauthorizedError({});
    }

    if (!isAuthorizedUser(userData)) {
      logger.warn('User auth header value parsed but not a valid AuthorizedUser object');
      throw new UnauthorizedError({});
    }
    req.user = userData;
    authenticateRequest(req);
    next();
  };
}

export function authenticatePlatformUser(): RequestHandler[] {
  return [
    authenticateUser(),
    (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedError({});
      } else if (!req.user.platformUser) {
        throw new ForbiddenError({});
      }

      next();
    },
  ];
}

function authenticateRequest(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError({});
  }
  const { platformUser, organizationId } = req.user;
  if (!platformUser) {
    const queryOrganizationId = req.query?.organizationId;
    const bodyOrganizationId = req.body?.organizationId;
    // Organization checks
    if (queryOrganizationId && queryOrganizationId !== organizationId) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }
    if (bodyOrganizationId && bodyOrganizationId !== organizationId) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }
  }
}
