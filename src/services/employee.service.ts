import {  Employee } from '@prisma/client';
import * as repository from '../repositories/employee.repository';
import { rootLogger } from '../utils/logger';
import { EmployeeEvent } from '../domain/events/employee.event';

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
