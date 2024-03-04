import { AuthorizedUser, USER_CATEGORY } from '../domain/user.domain';
import {
  AddGrievanceReportedEmployeeRecord,
  CreateGrievanceReportedEmployeeRecord
} from '../domain/dto/grievance-reported-employee.dto';
import { CreateCompanyLevelLeavePackageDto } from '../domain/dto/leave-package.dto';
import { ForbiddenError } from '../errors/http-errors';
import { CreateChildNodeDto, ChildNode } from '../domain/dto/company-tree-node.dto';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';
import { getParentEmployee, getSupervisees } from '../services/company-tree-node.service';
import { getEmployee } from '../services/employee.service';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { rootLogger } from '../utils/logger';

const logger = rootLogger.child({ context: 'HelpersUtil' });

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

export function generateChildNodes(childNodes: ChildNode[], companyId: number) {
  return childNodes.map(node => new CreateChildNodeDto(node, companyId));
}

type ManagePermissionScopeQueryOptsType = {
  [key: string]: string | number | boolean | undefined | null | Date | { [key: string]: any }
}

// calculate number of days between two given dates
export async function calculateDaysBetweenDates(startDate: Date, endDate: Date): Promise<number> {
  // To calculate the time difference of two dates 
  const differenceInTime = endDate.getTime() - startDate.getTime();

  // To calculate the no. of days between two dates 
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

  return differenceInDays;
}

type ScopedQuery = { scopedQuery: Record<string, any>; };

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

export async function applyCompanyScopeToQuery(
  user: AuthorizedUser,
  queryParams: Record<string, any>
): Promise<ScopedQuery> {
  const { platformUser, companyIds } = user;
  const { companyId: qCompanyId, ...query } = queryParams;

  let authorized = false;
  const scopeQuery = {
    companyId: { in: companyIds || [] }
  } as { [key: string]: any, companyId?: { in: number[] } | number };

  if (platformUser) {
    scopeQuery.companyId = qCompanyId || undefined;
    authorized = true;
  } else if (qCompanyId && companyIds.includes(qCompanyId)) {
    scopeQuery.companyId = qCompanyId;
    authorized = true;
  } else if (!qCompanyId && companyIds.length) {
    scopeQuery.companyId = { in: companyIds };
    authorized = true;
  }

  if (!authorized) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }

  return { scopedQuery: { ...query, ...scopeQuery } };
}

/*pass authUser, superviseesEmployeeIds, queryMode?,
if qemployeeId in superviseesEmployeeId or emplId === qempId
*/

export async function applySupervisionScopeToQuery(
  user: AuthorizedUser,
  queryParams: Record<string, any>
): Promise<ScopedQuery> {
  const { employeeId, category, companyIds } = user;
  const { employeeId: qEmployeeId, queryMode, ...query } = queryParams;
  if (!employeeId) {
    logger.warn('employeeId not present in AuthUser object');
    throw new UnauthorizedError({});
  }

  let authorized = false;
  const supervisees = await getSupervisees(user.employeeId!);
  const superviseeIds = supervisees.map(e => e.id);
  const scopeQuery = {
    employeeId,
    employee: { companyId: { in: companyIds } },
  } as { [key: string]: any, employeeId?: { in: number[] } | number };

  if (qEmployeeId) {
    if (
      category === USER_CATEGORY.HR || 
      employeeId === qEmployeeId || 
      superviseeIds?.includes(qEmployeeId)
    ) {
      scopeQuery.employeeId = qEmployeeId;
      authorized = true;
    }
  } else {
    authorized = true;
    switch (queryMode) {
    case RequestQueryMode.SUPERVISEES:
      scopeQuery.employeeId = { in: superviseeIds };
      break;
    case RequestQueryMode.ALL:
      if (category === USER_CATEGORY.HR) {
        scopeQuery.employeeId = undefined;
      } else {
        scopeQuery.employeeId = { in: [...superviseeIds, employeeId!] };
      }
      break;
    case RequestQueryMode.SELF:
    default:
      scopeQuery.employeeId = employeeId;
      break;
    }
  }

  if (!authorized) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }

  return { scopedQuery: { ...query, ...scopeQuery } };
}

export async function validateResponder(
  authUser: AuthorizedUser,
  requestorEmployeeId: number, 
): Promise<void> {
  const { employeeId, category, companyIds } = authUser;
  if (employeeId === requestorEmployeeId) {
    logger.warn('Responder of request cannot be same as requestor');
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }
  const [parentEmployee, requestorEmployee] = await Promise.all([
    getParentEmployee(requestorEmployeeId),
    getEmployee(requestorEmployeeId)
  ]);

  if (
    category !== USER_CATEGORY.HR 
    && (!parentEmployee || employeeId !== parentEmployee.id)
  ) {
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }
  //check if hr employee is of same company as requestor employee
  if ([USER_CATEGORY.HR, USER_CATEGORY.EMPLOYEE].includes(category) && (companyIds.length === 1)) {
    if(!companyIds.includes(requestorEmployee.companyId)) {
      throw new ForbiddenError({
        message: 'You are not allowed to perform this action'
      });
    }
  } else {
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }
}
