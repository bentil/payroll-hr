import { LeavePlan } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateLeavePlanDto,
  LeavePlanDto,
  QueryLeavePlanDto,
  UpdateLeavePlanDto,
} from '../domain/dto/leave-plan.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { 
  FailedDependencyError,
  ForbiddenError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import * as employeeRepository from '../repositories/employee.repository';
import * as leavePlanRepository from '../repositories/leave-plan.repository';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { countWorkingDays } from './holiday.service';
import { validate } from './leave-type.service';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'LeavePlanService' });
const events = {
  created: 'event.LeavePlan.created',
  modified: 'event.LeavePlan.modified',
  deleted: 'event.LeavePlan.deleted',
} as const;

export async function addLeavePlan(
  payload: CreateLeavePlanDto
): Promise<LeavePlanDto> {
  const { employeeId, leaveTypeId } = payload;
  
  // VALIDATION
  const validateData = await validate({ leaveTypeId, employeeId });
  logger.info(
    'LeavePackage for Employee[%s] and LeaveTypeId[%s] exists',
    employeeId, leaveTypeId
  );

  const {
    leavePackageId,
    considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday,
  } = validateData;

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
 
  logger.debug('Adding new LeavePlan to the database...');

  let newLeavePlan: LeavePlan;
  try {
    newLeavePlan = await leavePlanRepository.create(
      creatData, 
      { employee: true, leavePackage: { include: { leaveType: true } } }
    );
    logger.info('LeavePlan[%s] added successfully!', newLeavePlan.id);
  } catch (err) {
    logger.error('Adding LeavePlan failed', { error: err });
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
  query: QueryLeavePlanDto,
  authorizedUser: AuthorizedUser
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
    queryMode,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    authorizedUser, { employeeId, queryMode }
  );

  let result: ListWithPagination<LeavePlanDto>;
  try {
    logger.debug('Finding LeavePlan(s) that matched query', { query });
    result = await leavePlanRepository.find({
      skip,
      take,
      where: { 
        ...scopedQuery, 
        leavePackageId, 
        intendedStartDate: {
          gte: intendedStartDateGte && new Date(intendedStartDateGte),
          lt: intendedStartDateLte && dateutil.getDate(new Date(intendedStartDateLte), { days: 1 }),
        }, intendedReturnDate: {
          gte: intendedReturnDateGte && new Date(intendedReturnDateGte),
          lt: intendedReturnDateLte 
            && dateutil.getDate(new Date(intendedReturnDateLte), { days: 1 }),
        } 
      },
      orderBy: orderByInput,
      include: { 
        employee: true, 
        leavePackage: {
          include: { leaveType: true }
        } 
      }
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

export async function getLeavePlan(
  id: number,
  authorizedUser: AuthorizedUser
): Promise<LeavePlanDto> {
  logger.debug('Getting details for LeavePlan[%s]', id);
  let leavePlan: LeavePlanDto | null;
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    authorizedUser, { id, queryMode: RequestQueryMode.ALL }
  );

  try {
    leavePlan = await leavePlanRepository.findOne(
      { id, ...scopedQuery },
      { 
        employee: true, 
        leavePackage: {
          include: { leaveType: true }
        } 
      }
    );
  } catch (err) {
    logger.warn('Getting LeavePlan[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leavePlan) {
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'Leave plan does not exist'
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
  const { leaveTypeId, ...remainingData } = updateData;
  const { intendedStartDate, intendedReturnDate } = remainingData;
  const { employeeId } = authorizedUser;

  logger.debug('Validating LeavePlan[%s] & Employee[%s]', id, employeeId);
  let leavePlan: LeavePlanDto | null,
    employee: employeeRepository.EmployeeDto | null;
  try {
    [leavePlan, employee] = await Promise.all([
      leavePlanRepository.findOne(
        { id },
        { 
          employee: true, 
          leavePackage: {
            include: { leaveType: true }
          } 
        }
      ),
      employeeRepository.findOne(
        { id: employeeId },
        { company: true },
      ),
    ]);
  } catch (err) {
    logger.error(
      'Getting LeavePlan[%s] & Employee[%s] failed',
      id, employeeId, { error: (err as Error).stack }
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check(s) failed',
      cause: err,
    });
  }

  if (!employee) {
    logger.warn('Employee[%s] does not exist', employeeId);
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'Employee does not exist'
    });
  } else if (!leavePlan) {
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
  logger.info('LeavePlan[%s] & Employee[%s] validated!', id, employeeId);

  const {
    considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday,
  } = employee.company || {};
  let leavePackageId: number | undefined;
  if (leaveTypeId) {
    const leavePackage = await validate({ leaveTypeId, employeeId });
    leavePackageId = leavePackage.leavePackageId;
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
    where: { id },
    data: { 
      numberOfDays, 
      leavePackage: leavePackageId? { connect: { id: leavePackageId } } : undefined,
      ...remainingData 
    }, 
    include: { 
      employee: true, 
      leavePackage: {
        include: { leaveType: true }
      } 
    }
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
  let deletedLeavePlan: LeavePlan;
  try {
    deletedLeavePlan = await leavePlanRepository.deleteOne({ id });
    logger.info('LeavePlan[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting LeavePlan[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.LeavePlan.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedLeavePlan);
  logger.info(`${events.deleted} event created successfully!`);
}