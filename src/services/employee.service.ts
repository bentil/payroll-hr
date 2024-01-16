import {  Employee } from '@prisma/client';
import * as repository from '../repositories/employee.repository';
import { rootLogger } from '../utils/logger';
import { EmployeeEvent } from '../domain/events/employee.event';
import { InvalidStateError, NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';
import { managePermissionScopeQuery } from '../utils/helpers';
import { AuthorizedUser } from '../domain/user.domain';

const logger = rootLogger.child({ context: 'EmployeeService' });

export async function createOrUpdateEmployee(
  data: Omit<EmployeeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Employee> {
  logger.debug(
    'Saving Employee[%s]',
    data.id,
  );
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
    statusLastModifiedAt: data.statusLastModifiedAt
  });
  logger.info(
    'Employee[%s] saved',
    data.id
  );

  return employee;
}

export async function getEmployee(id: number): Promise<Employee> {
  logger.debug('Getting details for Employee[%s]', id);
  let employee: Employee | null;

  try {
    employee = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting Employee[%s] failed', id, { error: (err as Error).stack });
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
  id: number[],
): Promise<void> {
  const employeesList = new Set<number>(id);

  //TO DO -> CHANGE FIND TO COUNT
  const foundEmployees = await repository.find({
    where: { id: { in: [...employeesList] } }
  });

  if (foundEmployees.data.length !== employeesList.size) {
    logger.warn(
      'Received %d Employees id(s), but found %d',
      employeesList.size, foundEmployees.data.length
    );
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'At least one employee Id passed does not exist'
    });
  }
}
export async function validateEmployee(
  id: number, authorizedUser: AuthorizedUser,
  options?: {
    throwOnNotActive?: boolean,
    companyId?: number, companyIds?: number[]
  }
): Promise<Employee> {
  const distinctIds = new Set<number>(options?.companyIds);

  let companyIdQuery: {
    companyId?: number | { in: number[] };
  };
  if (options?.companyId) {
    companyIdQuery = {
      companyId: options?.companyId
    };
  } else {
    companyIdQuery = {
      companyId: { in: [...distinctIds] }
    };
  }

  logger.debug('Getting details for Employee[%s]', id);
  let employee: Employee | null;
  try {
    employee = await repository.findFirst({
      id,
      ...companyIdQuery
    });
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

  await managePermissionScopeQuery(authorizedUser,
    { queryCompanyId: employee.companyId, queryParam: {} }
  );

  logger.info('Employee[%s] details retrieved!', id);
  return employee;
}