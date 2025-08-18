import {  Employee, Prisma } from '@prisma/client';
import { EmployeeDto, EmployeeEvent } from '../domain/events/employee.event';
import { AuthorizedUser } from '../domain/user.domain';
import {
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  ServerError
} from '../errors/http-errors';
import * as repository from '../repositories/employee.repository';
import { errors } from '../utils/constants';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';


const logger = rootLogger.child({ context: 'EmployeeService' });

export async function createOrUpdateEmployee(
  data: Omit<EmployeeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Employee> {
  logger.debug('Saving Employee[%s]', data.id);
  const employee = await repository.createOrUpdate({
    id: data.id,
    address: data.address,
    status: data.status,
    companyId: data.companyId,
    notchId: data.notchId,
    employeeNumber: data.employeeNumber,
    title: data.title,
    firstName: data.firstName,
    lastName: data.lastName,
    otherNames: data.otherNames,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    photoUrl: data.photoUrl,
    ssn: data.ssn,
    taxIdentificationNumber: data.taxIdentificationNumber,
    majorGradeLevelId: data.majorGradeLevelId,
    minorGradeLevelId: data.minorGradeLevelId,
    nationality: data.nationality,
    regionId: data.regionId,
    tribeId: data.tribeId,
    email: data.email,
    privateEmail: data.privateEmail,
    msisdn: data.msisdn, 
    alternateMsisdn: data.alternateMsisdn,  
    digitalAddress: data.digitalAddress, 
    jobTitleId: data.jobTitleId, 
    departmentId: data.departmentId, 
    divisionId: data.divisionId, 
    stationId: data.stationId, 
    costAreaId: data.costAreaId,
    employmentDate: data.employmentDate,
    terminationDate: data.terminationDate,
    reemployed: data.reemployed,
    resident: data.resident,
    unionMember: data.unionMember,
    statusLastModifiedAt: data.statusLastModifiedAt,
    pensioner: data.pensioner,
    hr: data.hr,
    userId: data.userId,
    username: data.username,
    excludeFromPayrollRun: data.excludeFromPayrollRun,
  });
  logger.info('Employee[%s] saved', data.id);

  return employee;
}

export async function getEmployee(
  id: number,
  options?: {
    includeCompany?: boolean;
    includeMajorGradeLevel?: boolean;
  }
): Promise<EmployeeDto> {
  logger.debug('Getting details for Employee[%s]', id);
  let employee: Employee | null;

  try {
    employee = await repository.findOne(
      { id },
      {
        company: options?.includeCompany ? 
          true 
          : undefined,
        majorGradeLevel: options?.includeMajorGradeLevel 
          ? { include: { companyLevel: true } } 
          : undefined,
      }
    );
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employee) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'Employee does not exist'
    });
  }

  logger.info('Employee[%s] details retrieved!', id);
  return employee;
}

export async function validateEmployees(
  ids: number[],
): Promise<void> {
  const distinctIds = new Set<number>(ids);
  
  const foundCount = await repository.count({
    id: { in: [...distinctIds] }
  });

  if (foundCount !== distinctIds.size) {
    logger.warn(
      'Received %d Employees id(s), but found %d',
      distinctIds.size, foundCount
    );
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'At least one employee Id passed does not exist'
    });
  }
}

export async function validateEmployee(
  id: number, 
  authUser: AuthorizedUser,
  options?: {
    throwOnNotActive?: boolean,
    companyId?: number,
    companyIds?: number[],
    includeCompany?: boolean;
  }
): Promise<EmployeeDto> {
  const { companyId: oCompanyId, companyIds: oCompanyIds } = options ?? {};

  const checkPassed = !oCompanyIds
    || oCompanyIds.every(i => authUser.companyIds.includes(i));
  if (!checkPassed) {
    throw new ForbiddenError({
      message: 'User does not have access to some companies'
    });
  }

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId: oCompanyId }
  );

  if (oCompanyIds) {
    const combinedIds = oCompanyIds;
    if (oCompanyId) combinedIds.push(oCompanyId);
    scopedQuery.companyId = { in: combinedIds };
  }

  logger.debug('Getting details for Employee[%s]', id);
  let employee: Employee | null;
  try {
    employee = await repository.findFirst({ 
      id, 
      ...scopedQuery,
    },
    options?.includeCompany ? { company: true } : undefined
    );
  } catch (err) {
    logger.warn('Getting Employee[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employee) {
    logger.warn('Employee[%s] does not exist', id);
    throw new NotFoundError({ message: 'Employee does not exist' });
  }

  if (options?.throwOnNotActive) {
    if (employee.status !== 'ACTIVE') {
      throw new InvalidStateError({
        name: errors.EMPLOYEE_NOT_ACTIVE,
        message: 'Employee is not active'
      });
    }
  }

  logger.info('Employee[%s] details retrieved!', id);
  return employee;
}

export async function deleteEmployee(id: number): Promise<void> {
  const employee = await repository.findOne({ id });
  if (!employee) {
    logger.warn('Employee[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'Employee to delete does not exisit'
    });
  }

  logger.debug('Deleting Employee[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('Employee[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Employee[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}

export async function countEmployees(
  query: Prisma.EmployeeWhereInput
): Promise<number> {
  logger.debug('Getting count for Employee based on ', query);
  let employeeCount: number;

  try {
    employeeCount = await repository.count(
      query
    );
  } catch (err) {
    logger.warn(
      'Getting Employee count failed'
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  logger.info('EmployeeCount retrieved!');
  return employeeCount;
}
