import { LeavePlan } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateLeavePlanDto,
  LeavePlanDto,
  QueryLeavePlanDto,
  UpdateLeavePlanDto,
} from '../domain/dto/leave-plan.dto';
import * as leavePlanRepository from '../repositories/leave-plan.repository';
import * as leavePackageService from '../services/leave-package.service';
import * as employeeService from '../services/employee.service';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  FailedDependencyError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import { AuthorizedUser } from '../domain/user.domain';
import * as dateutil from '../utils/date.util';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceType' });

const events = {
  created: 'event.LeavePlan.created',
  modified: 'event.LeavePlan.modified',
};

export async function addLeavePlan(
  creatData: CreateLeavePlanDto, authorizedUser: AuthorizedUser
): Promise<LeavePlanDto> {
  const { employeeId, leavePackageId } = creatData;
  const { companyIds } = authorizedUser;

  // VALIDATION
  try {
    await Promise.all([
      employeeService.validateEmployee(employeeId, authorizedUser, { companyIds }),
      leavePackageService.getLeavePackageById(leavePackageId, { includeCompanyLevels: false })
    ]);
  } catch (err) {
    logger.warn('Validating employee[%s] and/or leavePackage[%s] fialed', 
      employeeId, leavePackageId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('employee[%s] and leavePackage[%s] exists', employeeId, leavePackageId);
 
  logger.debug('Adding new Leave plan to the database...');

  let newLeavePlan: LeavePlan;
  try {
    newLeavePlan = await leavePlanRepository.create(creatData, true);
    logger.info('LeavePlan[%s] added successfully!', newLeavePlan.id);
  } catch (err) {
    logger.error('Adding leavePlan failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.LeavePlan.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newLeavePlan);
  logger.info(`${events.created} event created successfully!`);

  return newLeavePlan;
}

export async function getLeavePlans(
  query: QueryLeavePlanDto
): Promise<ListWithPagination<LeavePlanDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId,
    leavePackageId,
    'intendedStartDate.gte': intendedStartDateGte,
    'intendedStartDate.lte': intendedStartDateLte,
    'intendedReturnDate.gte': intendedReturnDateGte,
    'intendedReturnDate.lte': intendedReturnDateLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<LeavePlanDto>;
  try {
    logger.debug('Finding LeavePlan(s) that matched query', { query });
    result = await leavePlanRepository.find({
      skip,
      take,
      where: { employeeId, leavePackageId, intendedStartDate: {
        gte: intendedStartDateGte && new Date(intendedStartDateGte),
        lt: intendedStartDateLte && dateutil.getDate(new Date(intendedStartDateLte), { days: 1 }),
      }, intendedReturnDate: {
        gte: intendedReturnDateGte && new Date(intendedReturnDateGte),
        lt: intendedReturnDateLte && dateutil.getDate(new Date(intendedReturnDateLte), { days: 1 }),
      } },
      orderBy: orderByInput,
      includeRelations: true
    });
    logger.info('Found %d LeavePlan(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying LeavePlan with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getLeavePlan(id: number): Promise<LeavePlanDto> {
  logger.debug('Getting details for LeavePlan[%s]', id);
  let leavePlan: LeavePlanDto | null;

  try {
    leavePlan = await leavePlanRepository.findOne({ id }, true);
  } catch (err) {
    logger.warn('Getting LeavePlan[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leavePlan) {
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'LeavePlan does not exist'
    });
  }

  logger.info('LeavePlan[%s] details retrieved!', id);
  return leavePlan;
}

export async function updateLeavePlan(
  id: number, 
  updateData: UpdateLeavePlanDto
): Promise<LeavePlanDto> {
  const { leavePackageId } = updateData;
  const leavePlan = await leavePlanRepository.findOne({ id }, true);
  if (!leavePlan) {
    logger.warn('LeavePlan[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'Leave plan to update does not exisit'
    });
  }

  // Validation
  if (leavePackageId) {
    try {
      leavePackageService.getLeavePackageById(leavePackageId, { includeCompanyLevels: false });
    } catch (err) {
      logger.warn('Getting LeavePackage[%s] fialed', leavePackageId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
  }
  
  logger.debug('Persisting update(s) to LeavePlan[%s]', id);
  const updatedLeavePlan = await leavePlanRepository.update({
    where: { id }, data: updateData, includeRelations: true
  });
  logger.info('Update(s) to LeavePlan[%s] persisted successfully!', id);

  // Emit event.LeavePlan.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedLeavePlan);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedLeavePlan;
}

export async function deleteLeavePlan(id: number): Promise<void> {
  const leavePlan = await leavePlanRepository.findOne({ id });
  if (!leavePlan) {
    logger.warn('LeavePlan[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'Leave plan to delete does not exisit'
    });
  }

  logger.debug('Deleting LeavePlan[%s] from database...', id);
  try {
    await leavePlanRepository.deleteLeavePlan({ id });
    logger.info('LeavePlan[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting LeavePlan[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}