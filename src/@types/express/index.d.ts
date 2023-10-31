import { AuthorizedUser  } from '../../domain/user.domain';

declare global {
    namespace Express {
      export interface Request {
        user?: AuthorizedUser;
      }
    }
  }