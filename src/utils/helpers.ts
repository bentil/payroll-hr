import {
  CreateGrievanceReportedEmployeeRecord
} from '../domain/dto/grievance-reported-employee.dto';
import {
  CreateCompanyLevelLeavePackageDto
} from '../domain/dto/leave-package.dto';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import { ForbiddenError, NotFoundError } from '../errors/http-errors';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { getSupervisees } from '../services/company-tree-node.service';
import {
  getEmployeeApproversWithDefaults
} from '../services/employee-approver.service';
import { getEmployee } from '../services/employee.service';
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
    reportedEmployeeId => new CreateGrievanceReportedEmployeeRecord(
      reportId,
      reportedEmployeeId
    )
  );
}

export function generateLeavePackageRecordsForACompanyLevel(
  leavePackageIds: number[],
  companyLevelId: number
) {
  return leavePackageIds.map(leavePackageId =>
    new CreateCompanyLevelLeavePackageDto(companyLevelId, leavePackageId));
}

// calculate number of days between two given dates
export async function calculateDaysBetweenDates(
  startDate: Date,
  endDate: Date
): Promise<number> {
  // To calculate the time difference of two dates 
  const differenceInTime = endDate.getTime() - startDate.getTime();

  // To calculate the no. of days between two dates 
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

  return differenceInDays;
}

type NumberOrInNumbers = number | { in: number[]; };

type ScopedQuery = {
  scopedQuery: {
    companyId?: NumberOrInNumbers;
    employeeId?: NumberOrInNumbers;
    employee?: { companyId: NumberOrInNumbers; };
  } & Record<string, any>;
};

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

export async function applySupervisionScopeToQuery(
  user: AuthorizedUser,
  queryParams: Record<string, any>,
  options?: { extendAdminCategories?: UserCategory[]; },
): Promise<ScopedQuery> {
  const { employeeId, category, companyIds } = user;
  const { extendAdminCategories } = options || {};
  const {
    employeeId: qEmployeeId,
    companyId: qCompanyId,
    queryMode,
    ...query
  } = queryParams;

  let superviseeIds: number[] = [];
  if (!extendAdminCategories?.includes(category) && !employeeId) {
    logger.warn('employeeId not present in AuthUser object');
    throw new UnauthorizedError({});
  } else if (employeeId) {
    try {
      const supervisees = await getSupervisees(employeeId);
      superviseeIds = supervisees.map(e => e.id);
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
    }
    
  }

  const hasAdminCategory = (
    category === UserCategory.HR || extendAdminCategories?.includes(category)
  );
  let authorized = false;
  const scopeQuery = {
    employeeId,
    employee: { companyId: qCompanyId ? qCompanyId : { in: companyIds } },
  } as { [key: string]: any, employeeId?: { in: number[] } | number };

  if (qEmployeeId) {
    if (
      hasAdminCategory
      || employeeId === qEmployeeId
      || superviseeIds.includes(qEmployeeId)
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
      if (hasAdminCategory) {
        scopeQuery.employeeId = undefined;
      } else {
        scopeQuery.employeeId = { in: [...superviseeIds, employeeId!] };
      }
      break;
    case RequestQueryMode.SELF:
    default:
      scopeQuery.employeeId = employeeId!;
      break;
    }
  }

  if (!authorized) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }

  return { scopedQuery: { ...query, ...scopeQuery } };
}

export async function applyEmployeeScopeToQuery(
  user: AuthorizedUser,
  queryParams: Record<string, any>,
): Promise<ScopedQuery> {
  const { category } = user;

  let queryMode: RequestQueryMode;
  if (category === UserCategory.HR) {
    queryMode = RequestQueryMode.ALL;
  } else {
    queryMode = RequestQueryMode.SELF;
  }

  return await applySupervisionScopeToQuery(
    user, 
    { queryMode, ...queryParams }
  );
}

export async function validateResponder(params: {
  requestorEmployeeId: number, 
  expectedLevel?: number,
  authUser: AuthorizedUser,
}): Promise<void> {
  const { authUser, requestorEmployeeId, expectedLevel } = params;
  const { employeeId, category, companyIds } = authUser;
  if (employeeId === requestorEmployeeId) {
    logger.warn('Responder of request cannot be same as requestor');
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }
  const requestorEmployee = await getEmployee(requestorEmployeeId);

  if (category !== UserCategory.HR && employeeId) {
    const employeeApprovers = await getEmployeeApproversWithDefaults({
      employeeId: requestorEmployeeId, level: expectedLevel
    });
    const approverCheck = employeeApprovers.filter(x => x.approverId === employeeId);
    if (approverCheck.length === 0) {
      throw new ForbiddenError({
        message: 'You are not allowed to perform this action'
      });
    }
  }
  //check if hr employee is of same company as requestor employee
  if ([UserCategory.HR, UserCategory.EMPLOYEE].includes(category) && (companyIds.length === 1)) {
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
