export interface AuthorizedUser {
  userId: string;
  username: string;
  name?: string;
  organizationId: string;
  organizationRoleId: string;
  companyIds: number[];
  platformUser: boolean;
  sessionId?: string;
}

export function isAuthorizedUser(obj: any): obj is AuthorizedUser {
  return 'userId' in obj && 'organizationId' in obj && 'companyIds' in obj && 'platformUser' in obj;
}
