import { 
  LEAVE_REQUEST_STATUS,
  LeaveRequest 
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  AdjustDaysDto,
  CreateLeaveRequestDto,
  LeaveRequestDto,
  QueryLeaveRequestDto,
  LeaveResponseInputDto,
  UpdateLeaveRequestDto,
} from '../domain/dto/leave-request.dto';
import { EmployeLeaveTypeSummary } from '../domain/dto/leave-type.dto';
import { AuthorizedUser, USER_CATEGORY } from '../domain/user.domain';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import * as leaveRequestRepository from '../repositories/leave-request.repository';
import { 
  FailedDependencyError, 
  ForbiddenError, 
  HttpError, 
  InvalidStateError, 
  NotFoundError, 
  RequirementNotMetError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { getApplicableLeavePackage } from './leave-package.service';
import { validate } from './leave-type.service';
import { countWorkingDays } from './holiday.service';
import * as employeeRepository from '../repositories/employee.repository';
import { getParent } from './company-tree-node.service';
import { findFirst as findCompanyTreeNode } from '../repositories/company-tree-node.repository';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceType' });

const events = {
  created: 'event.LeaveRequest.created',
  modified: 'event.LeaveRequest.modified',
  deleted: 'event.LeaveRequest.deleted',
};

export async function addLeaveRequest(
  payload: CreateLeaveRequestDto,
): Promise<LeaveRequestDto> {
  const { employeeId, leaveTypeId } = payload;
  let validateData, nodeExist, leaveSummary;
  // VALIDATION
  try {
    [nodeExist, validateData, leaveSummary] = await Promise.all([
      findCompanyTreeNode({ employeeId }),
      validate(leaveTypeId, employeeId),
      getEmployeeLeaveTypeSummary(employeeId, leaveTypeId)
    ]);
  } catch (err) {
    logger.warn('Validating Employee[%s] and/or LeaveType[%s] failed', 
      employeeId, leaveTypeId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Employee[%s] and LeaveType[%s] exists', employeeId, leaveTypeId);

  if (!nodeExist) {
    throw new RequirementNotMetError({
      message: 'Kindly contact HR to complete your setup'
    });
  }

  const { leavePackageId, considerPublicHolidayAsWorkday, considerWeekendAsWorkday } = validateData;

  const numberOfDays = await countWorkingDays({ 
    startDate: payload.startDate, 
    endDate: payload.returnDate, 
    includeHolidays: considerPublicHolidayAsWorkday,
    includeWeekends: considerWeekendAsWorkday 
  });
  console.log(leaveSummary);

  if (numberOfDays > leaveSummary.numberOfDaysLeft) {
    logger.warn('Number of days requested is more than number of days left for this leave');
    throw new RequirementNotMetError({
      name: errors.LEAVE_QUOTA_EXCEEDED,
      message: `You have ${leaveSummary.numberOfDaysLeft} day(s) left for this leave type`
    });

  }
  const createData: leaveRequestRepository.CreateLeaveRequestObject = {
    employeeId: payload.employeeId,
    leavePackageId,
    startDate: payload.startDate,
    returnDate: payload.returnDate,
    comment: payload.comment,
    numberOfDays
  };
 
  logger.debug('Adding new LeaveRequest to the database...');

  let newLeaveRequest: LeaveRequest;
  try {
    newLeaveRequest = await leaveRequestRepository.create(createData, true);
    logger.info('LeaveRequest[%s] added successfully!', newLeaveRequest.id);
  } catch (err) {
    logger.error('Adding LeaveRequest failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.LeaveRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newLeaveRequest);
  logger.info(`${events.created} event created successfully!`);

  return newLeaveRequest;
}


//Access to deal with on employees supervisor
export async function getLeaveRequests(
  query: QueryLeaveRequestDto, authorizedUser: AuthorizedUser,
): Promise<ListWithPagination<LeaveRequestDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId: qEmployeeId,
    leavePackageId,
    status,
    queryMode,
    'startDate.gte': startDateGte,
    'startDate.lte': startDateLte,
    'returnDate.gte': returnDateGte,
    'returnDate.lte': returnDateLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    authorizedUser, { employeeId: qEmployeeId, queryMode }
  );

  let result: ListWithPagination<LeaveRequestDto>;
  try {
    logger.debug('Finding LeaveRequest(s) that matched query', { query });
    result = await leaveRequestRepository.find({
      skip,
      take,
      where: { 
        ...scopedQuery,
        leavePackageId, 
        status, 
        startDate: {
          gte: startDateGte && new Date(startDateGte),
          lt: startDateLte && dateutil.getDate(new Date(startDateLte), { days: 1 }),
        }, 
        returnDate: {
          gte: returnDateGte && new Date(returnDateGte),
          lt: returnDateLte && dateutil.getDate(new Date(returnDateLte), { days: 1 }),
        }
      },
      orderBy: orderByInput,
      includeRelations: true
    });
    logger.info('Found %d LeaveRequest(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying LeaveRequest with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

//Access to deal with on supervisor stuff
export async function getLeaveRequest(
  id: number,
  authorizedUser: AuthorizedUser
): Promise<LeaveRequestDto> {
  const { employeeId } = authorizedUser;

  logger.debug('Getting details for LeaveRequest[%s]', id);
  let leaveRequest: LeaveRequestDto | null;
  try {
    leaveRequest = await leaveRequestRepository.findOne({ id }, true);
  } catch (err) {
    logger.warn('Getting LeaveRequest[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request does not exist'
    });
  }

  const parent = await getParent(leaveRequest.employeeId);
  if (parent){
    if (!employeeId || employeeId !== parent.id) {
      throw new ForbiddenError({
        message: 'You are not allowed to perform this action'
      });
    }  
  } else {
    if (!employeeId || employeeId !== leaveRequest.employeeId) {
      throw new ForbiddenError({
        message: 'You are not allowed to perform this action'
      });
    }  
  }
  
  logger.info('LeaveRequest[%s] details retrieved!', id);
  return leaveRequest;
}

export async function updateLeaveRequest(
  id: number, 
  updateData: UpdateLeaveRequestDto,
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { leaveTypeId, startDate, returnDate, comment } = updateData;
  const { employeeId } = authorizedUser;

  logger.debug('Finding LeaveRequest[%s] to update', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to update does not exisit'
    });
  } else if (employeeId !== leaveRequest.employeeId) {
    logger.warn(
      'LeaveRequest[%s] was not created by Employee[%s]. Update rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    logger.warn(
      'LeaveRequest[%s] cannot be updated due to current status[%s]',
      id, leaveRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed due to the current state of the leave request'
    });
  }

  // Obtain applicable leave package for new leave type id
  let leavePackageId, considerPublicHolidayAsWorkday, considerWeekendAsWorkday ;

  if (leaveTypeId) {
    logger.debug(
      'Fetching applicable LeavePackage of LeaveType[%s] for Employee[%s]',
      leaveTypeId, employeeId
    );
    try {
      const validateData = await validate(leaveTypeId, employeeId);
      leavePackageId = validateData.leavePackageId;
      considerPublicHolidayAsWorkday = validateData.considerPublicHolidayAsWorkday;
      considerWeekendAsWorkday = validateData.considerWeekendAsWorkday;
      logger.info(
        'Obtained applicable LeavePackage of LeaveType[%s] for Employee[%s]',
        leaveTypeId, employeeId
      );
    } catch (err) {
      logger.warn(
        'Fetching applicable LeavePackage of LeaveType[%s] for Employee[%s] failed',
        leaveTypeId, employeeId, { error: err }
      );
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Failed to get applicable leave package',
        cause: err
      });
    }
  } else {
    const employee = await employeeRepository.findOne({ id: employeeId }, true);
    considerPublicHolidayAsWorkday = employee?.company?.considerPublicHolidayAsWorkday;
    considerWeekendAsWorkday = employee?.company?.considerWeekendAsWorkday;
  }

  let numberOfDays: number | undefined;
  if (startDate && returnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate, 
      endDate: returnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  } else if (startDate) {
    numberOfDays = await countWorkingDays({ 
      startDate, 
      endDate: leaveRequest.returnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  } else if (returnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate: leaveRequest.startDate, 
      endDate: returnDate, 
      includeHolidays: considerPublicHolidayAsWorkday,
      includeWeekends: considerWeekendAsWorkday 
    });
  }
  
  logger.debug('Persisting update(s) to LeaveRequest[%s]', id);
  const updatedLeaveRequest = await leaveRequestRepository.update({
    where: { id },
    data: {
      numberOfDays,
      startDate,
      returnDate,
      comment,
      leavePackageId
    },
    includeRelations: true
  });
  logger.info('Update(s) to LeaveRequest[%s] persisted successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedLeaveRequest;
}

export async function deleteLeaveRequest(id: number): Promise<void> {
  logger.debug('Finding LeaveRequest[%s] to delete', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to delete does not exist'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    logger.warn(
      'LeaveRequest[%s] cannot be deleted due to current status[%s]',
      id, leaveRequest.status
    );
  }

  logger.debug('Deleting LeaveRequest[%s] from database...', id);
  try {
    await leaveRequestRepository.remove({ id });
    logger.info('LeaveRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting LeaveRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.LeaveRequest.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, leaveRequest);
  logger.info(`${events.deleted} event emitted successfully!`);
}

export async function addLeaveResponse(
  id: number, 
  responseData: LeaveResponseInputDto,
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { employeeId, category } = authorizedUser;
  let approvingEmployeeId: number;
  if (employeeId) {
    approvingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding LeaveRequest[%s] to respond to', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to add response to does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to add response to does not exist'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    logger.warn(
      'LeaveRequest[%s] cannot be responded to due to current status[%s]',
      id, leaveRequest.status
    );
    throw new InvalidStateError({
      message: 'Response not allowed for this leave request'
    });
  } 
  logger.info('LeaveRequest[%s] exists and can be responded to', id);

  await helpers.validateResponder(employeeId, leaveRequest.employeeId, category);

  logger.debug('Adding response to LeaveRequest[%s]', id);
  const updatedLeaveRequest = await leaveRequestRepository.respond({
    id,
    data: { ...responseData, approvingEmployeeId },
    includeRelations: true
  });
  logger.info('Response added to LeaveRequest[%s] successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedLeaveRequest;
}

export async function cancelLeaveRequest(
  id: number, 
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { employeeId } = authorizedUser;
  
  logger.debug('Finding LeaveRequest[%s] to cancel', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to cancel does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to cancel does not exisit'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING 
    && leaveRequest.status !== LEAVE_REQUEST_STATUS.APPROVED) {
    logger.warn(
      'LeaveReqeust[%s] cannot be cancelled due to current status[%s]',
      id, leaveRequest.status
    );
    throw new InvalidStateError({
      message: 'Leave request cannot be cancelled'
    });
  }
  logger.info('LeaveRequest[%s] exists and can be cancelled', id);

  // TODO: Check is authUser employee is an HR employee
  if (!employeeId || employeeId !== leaveRequest.employeeId) {
    logger.warn(
      'LeaveRequest[%s] can only be cancelled by Employee[%s] or HR employee',
      id, leaveRequest.employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to cancel this leave request'
    });
  }

  const leaveStartDate = new Date(leaveRequest.startDate);
  const now = new Date();
  if (leaveStartDate.getTime() <= now.getTime()) {
    logger.warn(
      'LeaveRequest[%s] cannot be cancelled because StartDate[%s] is past',
      id, leaveStartDate
    );
    throw new RequirementNotMetError({
      message: 'Leave request start date exceeded'
    });
  }

  logger.debug('Cancelling LeaveRequest[%s]', id);
  let cancelledLeaveRequest: LeaveRequestDto;
  try {
    cancelledLeaveRequest = await leaveRequestRepository.cancel({
      id,
      cancelledByEmployeeId: employeeId,
      includeRelations: true
    });
    logger.info('LeaveRequest[%s] cancelled successfully', id);
  } catch (err) {
    logger.error('Cancelling LeaveRequest[%] failed', id, { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, cancelledLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return cancelledLeaveRequest;
}

export async function getEmployeeLeaveTypeSummary(
  employeeId: number,
  leaveTypeId: number
): Promise<EmployeLeaveTypeSummary> {
  logger.debug(
    'Finding applicable LeavePackage of LeaveType[%s] for Employee[%s]',
    leaveTypeId, employeeId
  );
  const leavePackage = await getApplicableLeavePackage(employeeId, leaveTypeId);
  logger.info(
    'Found applicable LeavePackage of LeaveType[%s] for Employee[%s]',
    leaveTypeId, employeeId
  );
  const { maxDays: numberOfDaysAllowed } = leavePackage;
  
  const currentYear = new Date().getFullYear();
  const firstDay = new Date(currentYear, 0, 1);
  const lastDay = new Date(currentYear, 11, 31);

  logger.debug(
    'Fetching APPROVED and PENDING LeaveRequests of LeavePackage[%s] for Employee[%s] for %s',
    leavePackage.id, employeeId, currentYear
  );
  const [leaveRequestStatusApproved, leaveRequestStatusPending] = await Promise.all([
    leaveRequestRepository.find({
      where:{
        employeeId,
        leavePackageId: leavePackage.id,
        status: LEAVE_REQUEST_STATUS.APPROVED,
        createdAt: {
          gte: firstDay,
          lte: lastDay
        }
      }
    }),
    leaveRequestRepository.find({
      where: {
        employeeId,
        leavePackageId: leavePackage.id,
        status: LEAVE_REQUEST_STATUS.PENDING,
        createdAt: {
          gte: firstDay,
          lte: lastDay
        }
      }
    }),
  ]);
  logger.info(
    'Fetched APPROVED and PENDING LeaveRequests of LeavePackage[%s] for Employee[%s] for %s',
    leavePackage.id, employeeId, currentYear
  );

  logger.debug('Computing Employee[%s] LeaveType[%s] summary', employeeId, leaveTypeId);
  const numberOfDaysUsed = leaveRequestStatusApproved.data.reduce(
    (accumulator, currentValue) => {
      return accumulator + currentValue.numberOfDays!;
    }, 0);
  const numberOfDaysPending = leaveRequestStatusPending.data.reduce(
    (accumulator, currentValue) => {
      return accumulator + currentValue.numberOfDays!;
    }, 0);
  const numberOfDaysLeft = numberOfDaysAllowed - (numberOfDaysUsed + numberOfDaysPending);
  logger.info('Employee[%s] LeaveType[%s] summary computed', employeeId, leaveTypeId);

  return {
    numberOfDaysAllowed,
    numberOfDaysUsed,
    numberOfDaysPending,
    numberOfDaysLeft
  };
}

export async function adjustDays(
  id: number,
  authorizedUser: AuthorizedUser,
  payload: AdjustDaysDto
): Promise<LeaveRequestDto> {
  const { employeeId, category } = authorizedUser;
  
  logger.debug('Finding LeaveRequest[%s] to adjust', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  // check for employee being an hr
  if(category !== USER_CATEGORY.HR) {
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }
  
  if (!leaveRequest) {
    logger.debug('LeaveRequest[%s] to adjust does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request does not exist'
    });
  } else if (leaveRequest.employeeId === employeeId) {
    logger.warn(
      'LeaveRequest[%s] cannot be adjsted by the same Employee[%s] who requested leave',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'Action has to be performed by another user'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.APPROVED) {
    logger.warn(
      'LeaveRequest[%s] status is not approved. Status: %s',
      id, leaveRequest.status
    );
    throw new InvalidStateError({ message: 'Leave request cannot be adjusted' });
  }

  logger.debug('Adjusting number of days for LeaveRequest[%s]', id);
  const adjustedLeaveRequest = await leaveRequestRepository.adjustDays({
    id,
    data: {
      ...payload,
      respondingEmployeeId: authorizedUser.employeeId!
    }
  });
  logger.info('Number of days adjusted for LeaveRequest[%s] successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, adjustedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return adjustedLeaveRequest;
}