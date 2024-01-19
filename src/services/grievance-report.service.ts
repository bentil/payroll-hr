import { Employee, GrievanceReport, GrievanceType, PayrollCompany } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateGrievanceReportDto,
  QueryGrievanceReportDto,
  UpdateGrievanceReportDto,
  SearchGrievanceReportDto,
  GrievanceReportDto,
} from '../domain/dto/grievance-report.dto';
import * as grievanceReportRepository from '../repositories/grievance-report.repository';
import * as payrollCompanyService from '../services/payroll-company.service';
import * as grievanceTypeService from '../services/grievance-type.service';
import * as employeeService from '../services/employee.service';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  FailedDependencyError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { errors } from '../utils/constants';
import { ListWithPagination } from '../repositories/types';
import { generateGrievanceReportNumber } from '../utils/generator.util';
import * as dateutil from '../utils/date.util';
import { AuthorizedUser } from '../domain/user.domain';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceReport' });

const events = {
  created: 'event.GrievanceReport.created',
  modified: 'event.GrievanceRepor.modified',
};

export async function addGrievanceReport(
  creatData: CreateGrievanceReportDto,
  authorizedUser: AuthorizedUser
): Promise<GrievanceReportDto> {
  const { companyId, reportingEmployeeId, reportedEmployeeId, grievanceTypeId } = creatData;
  let company: PayrollCompany, reportingEmployee: Employee, grievanceType: GrievanceType;
  let newGrievanceReport: GrievanceReport;
  const reportNumber = generateGrievanceReportNumber();
  const { organizationId } = authorizedUser;

  if (reportedEmployeeId) {
    //PERFORM VALIDATION 
    try {
      [company, reportingEmployee, grievanceType] = await Promise.all([
        payrollCompanyService.validatePayrollCompany(
          companyId, { throwOnNotActive: true, organizationId }
        ),
        employeeService.validateEmployee(
          reportingEmployeeId, authorizedUser, { throwOnNotActive: true, companyId }
        ),
        grievanceTypeService.getGrievanceType(grievanceTypeId),
        employeeService.validateEmployees(reportedEmployeeId)
      ]);
    } catch (err) {
      logger.warn('Getting PayrollCompany[%s] fialed', companyId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
    logger.info(
      'PayrollCompany[%s], ReportEmployee[%s] and GrievanceType[%s] exists',
      company, reportingEmployee, grievanceType
    );

    logger.debug('Adding new GrievanceReport to the database...');
    try {
      newGrievanceReport = 
        await grievanceReportRepository.createReportWithReportedEmployee({ 
          companyId, 
          reportingEmployeeId, 
          reportedEmployeeId, 
          grievanceTypeId,
          reportDate: creatData.reportDate,
          reportNumber,
          note: creatData.note,
        }, true);
      logger.info('GreivanceReport[%s] added successfully!', newGrievanceReport.id);
    } catch (err) {
      logger.error('Adding GrievanceReport failed', { error: err });
      throw new ServerError({
        message: (err as Error).message,
        cause: err
      });
    }
  } else {
    try {
      [company, reportingEmployee, grievanceType] = await Promise.all([
        payrollCompanyService.getPayrollCompany(companyId),
        employeeService.getEmployee(reportingEmployeeId),
        grievanceTypeService.getGrievanceType(grievanceTypeId)
      ]);
    } catch (err) {
      logger.warn('Getting PayrollCompany[%s] failed', companyId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
    logger.info('PayrollCompany[%s] and ReportEmployee[%s] exists', company, reportingEmployee);

    logger.debug('Adding new GrievanceReport to the database...');
    try {
      newGrievanceReport = 
        await grievanceReportRepository.create({
          companyId, 
          reportingEmployeeId, 
          grievanceTypeId,
          reportDate: creatData.reportDate,
          reportNumber,
          note: creatData.note,
        }, true);
      logger.info('GreivanceReport[%s] added successfully!', newGrievanceReport.id);
    } catch (err) {
      logger.error('Adding GrievanceReport failed', { error: err });
      throw new ServerError({
        message: (err as Error).message,
        cause: err
      });
    }
  }

  // Emit event.GrievanceReport.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newGrievanceReport);
  logger.info(`${events.created} event created successfully!`);

  return newGrievanceReport;
}

export async function getGrievanceReports(
  query: QueryGrievanceReportDto
): Promise<ListWithPagination<GrievanceReportDto>> {
  const {
    page,
    limit: take,
    orderBy,
    companyId,
    reportingEmployeeId,
    reportDate,
    grievanceTypeId,
    'createdAt.gte': createdAtGte,
    'createdAt.lte': createdAtLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<GrievanceReportDto>;
  try {
    logger.debug('Finding GrievanceReport(s) that matched query', { query });
    result = await grievanceReportRepository.find({
      skip,
      take,
      where: { companyId, reportDate, reportingEmployeeId, grievanceTypeId, createdAt: {
        gte: createdAtGte && new Date(createdAtGte),
        lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
      } },
      orderBy: orderByInput,
      includeRelations: true
    });
    logger.info('Found %d GrievanceReport(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying GrievanceReport with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function getGrievanceReport(id: number): Promise<GrievanceReportDto> {
  logger.debug('Getting details for GrievanceReport[%s]', id);
  let grievanceReport: GrievanceReportDto | null;

  try {
    grievanceReport = await grievanceReportRepository.findOne({ id }, true);
  } catch (err) {
    logger.warn('Getting GreivanceReport[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!grievanceReport) {
    throw new NotFoundError({
      name: errors.GRIEVANCE_REPORT_NOT_FOUND,
      message: 'Grievance report does not exist'
    });
  }

  logger.info('GrievanceReport[%s] details retrieved!', id);
  return grievanceReport;
}

export async function searchGrievanceReport(
  query: SearchGrievanceReportDto
): Promise<ListWithPagination<GrievanceReportDto>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 

  let result: ListWithPagination<GrievanceReportDto>;
  try {
    logger.debug('Finding GrievanceReport(s) that matched search query', { query });
    result = await grievanceReportRepository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        reportNumber: {
          search: searchParam,
        },
        note: {
          search: searchParam,
        },
      },
      includeRelations: true
    });
    logger.info('Found %d GrievanceReport(s) that matched query', { query });
  } catch (err) {
    logger.warn('Searching GrievanceReport with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateGrievanceReport(
  id: number, 
  updateData: UpdateGrievanceReportDto
): Promise<GrievanceReportDto> {
  const { grievanceTypeId } = updateData;

  const grievanceReport = await grievanceReportRepository.findOne({ id });
  if (!grievanceReport) {
    logger.warn('GrievnceReport[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.GRIEVANCE_REPORT_NOT_FOUND,
      message: 'Grievance report to update does not exisit'
    });
  }

  if (grievanceTypeId) {
    try {
      await grievanceTypeService.getGrievanceType(grievanceTypeId);
    } catch (err) {
      logger.warn('Getting GrievanceType[%s] fialed', grievanceTypeId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
    logger.info('PayrollCompany[%s] exists', grievanceTypeId);
  }

  logger.debug('Persisting update(s) to GrievanceReport[%s]', id);
  const updatedGrievanceReport = await grievanceReportRepository.update({
    where: { id }, data: updateData, includeRelations: true
  });
  logger.info('Update(s) to GrievanceReport[%s] persisted successfully!', id);

  // Emit event.GrievanceReport.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedGrievanceReport);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedGrievanceReport;
}

export async function deleteGrievanceReport(id: number): Promise<void> {
  const grievanceReport = await grievanceReportRepository.findOne({ id });
  if (!grievanceReport) {
    logger.warn('GrievanceReport[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.GRIEVANCE_REPORT_NOT_FOUND,
      message: 'Grievance report to delete does not exisit'
    });
  }

  logger.debug('Deleting GrievanceReport[%s] from database...', id);
  try {
    await grievanceReportRepository.deleteGrievanceReport({ id });
    logger.info('GrievanceReport[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting GrievanceReport[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}