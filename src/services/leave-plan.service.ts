import { LeavePlan } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateLeavePlanDto,
  LeavePlanDto,
  QueryLeavePlanDto,
  UpdateLeavePlanDto,
} from '../domain/dto/leave-plan.dto';
import * as leavePlanRepository from '../repositories/leave-plan.repository';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  FailedDependencyError, 
  ForbiddenError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import { validate } from './leave-type.service';
import { countWorkingDays } from './holiday.service';
import { AuthorizedUser } from '../domain/user.domain';
import * as employeeRepository from '../repositories/employee.repository';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceType' });

const events = {
  created: 'event.LeavePlan.created',
  modified: 'event.LeavePlan.modified',
};

export async function addLeavePlan(
  payload: CreateLeavePlanDto
): Promise<LeavePlanDto> {
  const { employeeId, leaveTypeId } = payload;
  let validateData;
  
  // VALIDATION
  try {
    validateData = await validate(leaveTypeId, employeeId);
  } catch (err) {
    logger.warn('Validating employee[%s] and/or leaveTypeId[%s] fialed', 
      employeeId, leaveTypeId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('LeavePackage for employee[%s] and leaveTypeId[%s] exists', employeeId, leaveTypeId);

  const { leavePackageId, considerPublicHolidayAsWorkday, considerWeekendAsWorkday } = validateData;


  const numberOfDays = await countWorkingDays({ 
    startDate: payload.intendedStartDate, 
    endDate: payload.intendedReturnDate, 
    includeHolidays: considerPublicHolidayAsWorkday,
    includeWeekends: considerWeekendAsWorkday 
  });
  const creatData: leavePlanRepository.CreateLeavePlanObject = {
    employeeId: payload.employeeId,
    intendedStartDate: payload.intendedStartDate,
    intendedReturnDate: payload.intendedReturnDate,
    comment: payload.comment,
    leavePackageId,
    numberOfDays
  };
 
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
  updateData: UpdateLeavePlanDto,
  authorizedUser: AuthorizedUser
): Promise<LeavePlanDto> {
  const { leaveTypeId, intendedStartDate, intendedReturnDate } = updateData;
  const { employeeId } = authorizedUser;

  const leavePlan = await leavePlanRepository.findOne({ id }, true);

  const employee = await employeeRepository.findOne({ id: employeeId }, true);
  const considerPublicHolidayAsWorkday = employee?.company?.considerPublicHolidayAsWorkday;
  const considerWeekendAsWorkday = employee?.company?.considerWeekendAsWorkday;

  if (!leavePlan) {
    logger.warn('LeavePlan[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'Leave plan to update does not exisit'
    });
  } else if (employeeId !== leavePlan.employeeId) {
    logger.warn(
      'LeavePlan[%s] was not created by Employee[%s]. Update rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }

  if (leaveTypeId) {
    try {
      validate(leaveTypeId);
    } catch (err) {
      logger.warn('Getting LeaveTypeId[%s] fialed', leaveTypeId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
  }
  
  let numberOfDays: number | undefined;
  if (intendedStartDate && intendedReturnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate: intendedStartDate, 
      endDate: intendedReturnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  } else if (intendedStartDate) {
    numberOfDays = await countWorkingDays({ 
      startDate: intendedStartDate, 
      endDate: leavePlan.intendedReturnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  } else if (intendedReturnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate: leavePlan.intendedStartDate, 
      endDate: intendedReturnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  }
  
  logger.debug('Persisting update(s) to LeavePlan[%s]', id);
  const updatedLeavePlan = await leavePlanRepository.update({
    where: { id }, data: { numberOfDays, ...updateData }, includeRelations: true
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