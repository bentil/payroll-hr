import { AuthorizedUser } from '../domain/user.domain';
import { 
  AddGrievanceReportedEmployeeRecord, 
  CreateGrievanceReportedEmployeeRecord
} from '../domain/dto/grievance-reported-employee.dto';
import { CreateCompanyLevelLeavePackageDto } from '../domain/dto/leave-package.dto';
import { ForbiddenError } from '../errors/http-errors';

export function getSkip(page: number, limit: number): number {
  if (page < 1 || limit < 1) return 0;
  return (page - 1) * limit;
}

export function getOrderByInput(orderBy: string): Record<string, string | object> {
  const [orderKey, direction] = orderBy.split(':');
  let sortData: Record<string, string | object> = {};
  const nestedKeys = orderKey.split('.');
  for (let i = nestedKeys.length - 1; i >= 0; i--) {
    const data: Record<string, string | object> = {};
    if (i === nestedKeys.length - 1) {
      data[nestedKeys[i]] = direction;
    } else {
      data[nestedKeys[i]] = sortData;
    }
    sortData = data;
  }
  return sortData;
}

// Convert bigint to string
export function toString(num: number): string {
  return num.toString();
}

export function generateRandomAlphanumeric(length: number): string {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    result += alphanumericChars[randomIndex];
  }

  return result;
}

export function getPage(skip: number, limit: number): number {
  if (skip <= 0) return 1;
  return Math.floor(skip / limit) + 1;
}

export function generateMultiGrievanceReportedEmployeesRecords(
  reportedEmployeeIds: number[], reportId: number
) {
  return reportedEmployeeIds.map(
    reportedEmployeeId => new CreateGrievanceReportedEmployeeRecord(reportId, reportedEmployeeId)
  );
}

export function generateMultiGrievanceReportedEmployeesDto(
  reportedEmployeeIds: number[],
) {
  return reportedEmployeeIds.map(
    reportedEmployeeId => new AddGrievanceReportedEmployeeRecord(reportedEmployeeId)
  );
}

export function generateMultiCompanyLevelLeavePackageRecords(
  companyLevelIds: number[],
  leavePackageId: number
) {
  return companyLevelIds.map(companyLevelId =>
    new CreateCompanyLevelLeavePackageDto(companyLevelId, leavePackageId));
}

export function generateLeavePackageRecordsForACompanyLevel(
  leavePackageIds: number[],
  companyLevelId: number
) {
  return leavePackageIds.map(leavePackageId =>
    new CreateCompanyLevelLeavePackageDto(companyLevelId, leavePackageId));
}

type ManagePermissionScopeQueryOptsType = {
  [key: string]: string | number | boolean | undefined | null | Date | { [key: string]: any }
}
/**
 * Function to check if user has permission to requests and return states
 * @param user AuthorizedUser
 * @param opts
 */
export async function managePermissionScopeQuery(user: AuthorizedUser,
  opts: {
    queryParam: ManagePermissionScopeQueryOptsType,
    queryCompanyId?: number
  }) {
  const { platformUser, companyIds } = user;
  const { queryParam, queryCompanyId } = opts;

  const scopeQuery = {
    companyId: { in: companyIds || [] }
  } as { [key: string]: any, companyId?: { in: number[] } | number };

  const checks = { authorized: false };

  if (platformUser) {
    scopeQuery.companyId = queryCompanyId || undefined;
    checks.authorized = true;
  } else if (queryCompanyId && companyIds.includes(queryCompanyId)) {
    scopeQuery.companyId = queryCompanyId;
    checks.authorized = true;
  } else if (!queryCompanyId && companyIds.length) {
    scopeQuery.companyId = { in: companyIds };
    checks.authorized = true;
  }
  if (checks.authorized === false) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }
  return { scopedQuery: { ...queryParam, ...scopeQuery }, query: queryParam, ...checks };
}
