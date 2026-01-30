import { EmployeeLeaveTypeSummary } from '@prisma/client';
import {
  CreateEmployeeLeaveTypeSummaryDto,
  EmployeeLeaveTypeSummaryDto,
  QueryEmployeeLeaveTypeSummaryDto,
  UpdateEmployeeLeaveTypeSummaryDto,
} from '../domain/dto/employee-leave-type-summary.dto';
import {
  HttpError,
  NotFoundError,
  ServerError
} from '../errors/http-errors';
// eslint-disable-next-line max-len
import * as repository from '../repositories/employee-leave-type-summary.repository';
import { ListWithPagination } from '../repositories/types';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { getApplicableLeavePackage } from './leave-package.service';
import { CronJob } from 'cron';
import config from '../config';
import { LeavePackageDto } from '../domain/dto/leave-package.dto';


const logger = rootLogger.child({ context: 'EmployeeLeaveTypeSummaryService' });

export async function createEmployeeLeaveTypeSummary(
  createEmployeeLeaveTypeSummaryDto: CreateEmployeeLeaveTypeSummaryDto,
): Promise<EmployeeLeaveTypeSummaryDto> {
  logger.debug('Persisting new EmployeeLeaveTypeSummary...');
  let employeeLeaveTypeSummary: EmployeeLeaveTypeSummaryDto;
  try {
    employeeLeaveTypeSummary = await repository.create(createEmployeeLeaveTypeSummaryDto);
    logger.info('EmployeeLeaveTypeSummary[%s] persisted successfully!');
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting EmployeeLeaveTypeSummary failed', { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return employeeLeaveTypeSummary;
}

export async function updateEmployeeLeaveTypeSummary(
  employeeId: number,
  leaveTypeId: number,
  year: number,
  updateEmployeeLeaveTypeSummaryDto: UpdateEmployeeLeaveTypeSummaryDto,
): Promise<EmployeeLeaveTypeSummaryDto> {
  const employeeLeaveTypeSummary = await repository.findOne({ 
    employeeId_leaveTypeId_year: {
      employeeId, leaveTypeId, year
    }
  });
  if (!employeeLeaveTypeSummary) {
    logger.warn('EmployeeLeaveTypeSummary to update does not exist');
    throw new NotFoundError({ message: 'Leave type to update does not exist' });
  }
  const updatedEmployeeLeaveTypeSummary = await repository.update({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    data: updateEmployeeLeaveTypeSummaryDto
  });

  logger.info('Update(s) to EmployeeLeaveTypeSummary persisted successfully!');
  return updatedEmployeeLeaveTypeSummary;
}

export async function getEmployeeLeaveTypeSummaries(
  query: QueryEmployeeLeaveTypeSummaryDto
): Promise<ListWithPagination<EmployeeLeaveTypeSummary>> {
  const {
    page,
    limit: take,
    orderBy,
    ...queryParam
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let employeeLeaveTypeSummary: ListWithPagination<EmployeeLeaveTypeSummary>;
  logger.debug('Finding EmployeeLeaveTypeSummary(s) that match query', { query });
  try {
    employeeLeaveTypeSummary = await repository.find({
      skip,
      take,
      where: {
        ...queryParam
      },
      orderBy: orderByInput
    });
    logger.info(
      'Found %d EmployeeLeaveTypeSummary(s) that matched query',
      employeeLeaveTypeSummary.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeLeaveTypeSummarys with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return employeeLeaveTypeSummary;
}


export async function getEmployeeLeaveTypeSummary(
  employeeId: number,
  leaveTypeId: number,
  year: number,
): Promise<EmployeeLeaveTypeSummary> {
  logger.debug(
    'Getting details for EmployeeLeaveTypeSummary with employeeId[%s], leaveTypeId[%s], year[%s]',
    employeeId, leaveTypeId, year
  );

  let employeeLeaveTypeSummary: EmployeeLeaveTypeSummary | null;
  try {
    employeeLeaveTypeSummary = await repository.findOne({ 
      employeeId_leaveTypeId_year: {
        employeeId, leaveTypeId, year
      }
    });
  } catch (err) {
    logger.warn('Getting EmployeeLeaveTypeSummary failed', { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeLeaveTypeSummary) {
    logger.warn('EmployeeLeaveTypeSummary does not exist');
    throw new NotFoundError({ message: 'Leave type does not exist' });
  }
  logger.info('EmployeeLeaveTypeSummary details retrieved!');
  return employeeLeaveTypeSummary;
}


export async function deleteEmployeeLeaveTypeSummary(
  employeeId: number,
  leaveTypeId: number,
  year: number,
): Promise<EmployeeLeaveTypeSummary> {
  logger.debug('Getting details for EmployeeLeaveTypeSummary for');
  let deletedEmployeeLeaveTypeSummary: EmployeeLeaveTypeSummary | null, 
    employeeLeaveTypeSummary: EmployeeLeaveTypeSummary | null;
  try {
    employeeLeaveTypeSummary = await repository.findOne({ employeeId_leaveTypeId_year: {
      employeeId, leaveTypeId, year
    } });
    logger.info(
      'EmployeeLeaveTypeSummary details retrieved for employeeId[%s], leaveTypeId[%s], year[%s]',
      employeeId, leaveTypeId, year
    );

    if (!employeeLeaveTypeSummary) {
      logger.warn(
        'EmployeeLeaveTypeSummary does not exist employeeId[%s], leaveTypeId[%s], year[%s]',
        employeeId, leaveTypeId, year
      );
      throw new NotFoundError({
        message: 'Employee leave type summary you are attempting to delete does not exist'
      });
    }
    deletedEmployeeLeaveTypeSummary = await repository.deleteOne({ employeeId_leaveTypeId_year: {
      employeeId, leaveTypeId, year
    } });
    logger.info('EmployeeLeaveTypeSummary successfully deleted!');
    return deletedEmployeeLeaveTypeSummary;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn(
      'Deleting EmployeeLeaveTypeSummary failed for employeeId[%s], leaveTypeId[%s], year[%s]',
      employeeId, leaveTypeId, year, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}

export const resetExpiredCarryOverDays = new CronJob (
  config.dailyCronJobTime,
  async function() {
    const currentYear = new Date().getFullYear();
    logger.debug('Resetting expired carry over days for year[%s]', currentYear);
    logger.debug(
      'Finding EmployeeLeaveTypeSummary(s) for year[%s] where carryOverDays > 0' +
      ' and leavePackage carryOverExpiryDate', 
      currentYear
    );
    const employeeLeaveTypeSummary = await repository.find({ 
      where: { 
        year: currentYear,
        carryOverDays: { gt: 0 },
        leaveType: {
          leavePackages: {
            some: {
              carryOverExpiryDate: { not: null }
            }
          }
        }
      }
    });
    for (const elts of employeeLeaveTypeSummary.data) {
      logger.debug(
        'Finding applicable LeavePackage of LeaveType[%s] for Employee[%s]',
        elts.leaveTypeId, elts.employeeId
      );
      let leavePackage: LeavePackageDto | undefined;
      try {
        leavePackage = await getApplicableLeavePackage(elts.employeeId, elts.leaveTypeId);
      } catch (err) {
        if (err instanceof NotFoundError) {
          logger.warn('Did not find any appicable leave packageof LeaveType[%s] for Employee[%s]',
            elts.leaveTypeId, elts.employeeId
          );
        } else {
          throw err;
        }
      }
      logger.info(
        'Found applicable LeavePackage of LeaveType[%s] for Employee[%s]',
        elts.leaveTypeId, elts.employeeId
      );
      
      if (leavePackage && leavePackage.carryOverExpiryDate) {
        const expiryDate = new Date(leavePackage.carryOverExpiryDate);
        if (expiryDate <= new Date()) {
          logger.debug(
            'Resetting carry over days for EmployeeLeaveTypeSummary' +
            ' with employeeId[%s], leaveTypeId[%s], year[%s]',
            elts.employeeId, elts.leaveTypeId, elts.year
          );
          
          await repository.update({
            where: { 
              employeeId_leaveTypeId_year: 
                { employeeId: elts.employeeId, 
                  leaveTypeId: elts.leaveTypeId, 
                  year: elts.year 
                } 
            },
            data: { carryOverDays: 0 }
          });
        }
      }
    }
  }
);

export async function createOrUpdateEmployeeLeaveTypeSummary(
  data: Omit<EmployeeLeaveTypeSummary, 'createdAt' | 'modifiedAt'>
): Promise<EmployeeLeaveTypeSummary> {
  logger.debug(
    'Saving EmployeeLeaveTypeSummary for employeeId[%s], leaveTypeId[%s], year[%s]',
    data.employeeId, data.leaveTypeId, data.year
  );
  const employeeLeaveTypeSummary = await repository.createOrUpdate({
    employeeId: data.employeeId,
    leaveTypeId: data.leaveTypeId,
    year: data.year,
    numberOfDaysUsed: data.numberOfDaysUsed,
    carryOverDays: data.carryOverDays,
    numberOfDaysPending: data.numberOfDaysPending,
    numberOfCarryOverDaysUsed: data.numberOfCarryOverDaysUsed ?? undefined,
  });
  logger.info(
    'EmployeeLeaveTypeSummary saved',
  );

  return employeeLeaveTypeSummary;
}