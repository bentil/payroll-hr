export enum UserCategory {
  OPERATIONS = 'OPERATIONS',
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR',
}

export interface AuthorizedUser {
  userId: string;
  username: string;
  name?: string;
  organizationId: string;
  organizationRoleId: string;
  category: UserCategory;
  companyIds: number[];
  employeeId?: number;
  platformUser: boolean;
  sessionId?: string;
  superviseeIds?: number[];
}

export function isAuthorizedUser(obj: any): obj is AuthorizedUser {
  return 'userId' in obj 
    && 'username' in obj 
    && 'organizationId' in obj 
    && 'organizationRoleId' in obj
    && 'category' in obj
    && 'companyIds' in obj
    && 'platformUser' in obj;
}