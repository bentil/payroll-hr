export interface AuthorizedUser {
  userId: string;
  organizationId: string;
  companyIds: string[];
  platformUser: boolean;
}

export function isAuthorizedUser(obj: any): obj is AuthorizedUser {
  return 'userId' in obj && 'organizationId' in obj && 'companyIds' in obj && 'platformUser' in obj;
}
