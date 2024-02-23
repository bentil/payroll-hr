import { NextFunction, Request, RequestHandler, Response } from 'express';
import { USER_CATEGORY, isAuthorizedUser } from '../domain/user.domain';
import { ForbiddenError } from '../errors/http-errors';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { rootLogger } from '../utils/logger';
// import { getSupervisees } from '../services/company-tree-node.service';

const logger = rootLogger.child({ context: 'AuthMiddleware' });
export function authenticateClient(req: Request, _res: Response, next: NextFunction) {
  const clientAppKey = req.headers['proxy-authorization'];
  if (!clientAppKey || clientAppKey !== process.env.APP_KEY) {
    throw new UnauthorizedError({});
  }
  next();
}

export function authenticateUser(
  options?: { optional?: boolean, isEmployee?: boolean }
): RequestHandler {
  //add a checker for employeeId in authUser and throw forbidden error if not employees
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

    if (options?.isEmployee) {
      if (
        !req.user.employeeId || 
        ![USER_CATEGORY.EMPLOYEE, USER_CATEGORY.HR].includes(req.user.category) 
      ) {
        throw new ForbiddenError({});
      }
      return next();
    }

    authenticateRequest(req);
    next();
  };
}

// export function authenticateUserAsync(
//   options?: { optional?: boolean, isEmployee?: boolean }
// ): RequestHandler {
//   //add a checker for employeeId in authUser and throw forbidden error if not employees
//   const optional = options?.optional !== undefined ? options.optional : false;
//   return async (req: Request, _res: Response, next: NextFunction) => {
//     const data = req.headers['user-metadata'];
//     if (!data) {
//       if (!optional) {
//         logger.warn('User auth header is missing or blank');
//         throw new UnauthorizedError({});
//       }
//       return next(); // Skip verification if data not present and auth optional
//     }

//     let userData: any;
//     try {
//       userData = JSON.parse(data as string);
//     } catch (err) {
//       logger.warn('Failed to parse user auth header value', { error: err });
//       throw new UnauthorizedError({});
//     }

//     if (!isAuthorizedUser(userData)) {
//       logger.warn('User auth header value parsed but not a valid AuthorizedUser object');
//       throw new UnauthorizedError({});
//     }
//     req.user = userData;

//     if (options?.isEmployee) {
//       if (!req.user.employeeId) {
//         throw new ForbiddenError({});
//       }
//       console.log('before');
//       const supervisees = await getSupervisees(req.user.employeeId);
//       req.user.superviseeIds = supervisees.map(e => e.id);
//       console.log(req.user);
//       next();
//     }

//     authenticateRequest(req);
//     next();
//   };
// }

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
  const { platformUser, organizationId, companyIds } = req.user;
  if (!platformUser) {
    const queryOrganizationId = req.query?.organizationId;
    const bodyOrganizationId = req.body?.organizationId;
    const queryCompanyId = req.query?.companyId;
    const bodyCompanyId = req.body?.companyId;

    // Organization checks
    if (queryOrganizationId && queryOrganizationId !== organizationId) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }
    if (bodyOrganizationId && bodyOrganizationId !== organizationId) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }

    // Company checks
    if (queryCompanyId && !companyIds.includes(Number(queryCompanyId))) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }
    if (bodyCompanyId && !companyIds.includes(Number(bodyCompanyId))) {
      throw new ForbiddenError({ message: 'User not allowed to perform action.' });
    }
  }
}
