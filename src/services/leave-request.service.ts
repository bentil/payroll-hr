import { 
  LEAVE_REQUEST_STATUS, 
  LeaveRequest 
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateLeaveRequestDto,
  LeaveRequestDto,
  QueryLeaveRequestDto,
  UpdateLeaveRequestDto,
  ResponseObjectDto,
  LEAVE_RESPONSE_ACTION,
} from '../domain/dto/leave-request.dto';
import * as leaveRequestRepository from '../repositories/leave-request.repository';
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
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { validate } from './leave-type.service';
import { getApplicableLeavePackage } from './leave-package.service';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceType' });

const events = {
  created: 'event.LeaveRequest.created',
  modified: 'event.LeaveRequest.modified',
};

export async function addLeaveRequest(
  payload: CreateLeaveRequestDto,
): Promise<LeaveRequestDto> {
  const { employeeId, leaveTypeId } = payload;
  let leavePackageId: number;

  // VALIDATION
  try {
    leavePackageId = await validate(leaveTypeId, employeeId);
  } catch (err) {
    logger.warn('Validating employee[%s] and/or leaveType[%s] failed', 
      employeeId, leaveTypeId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('employee[%s] and leaveType[%s] exists', employeeId, leaveTypeId);

  const numberOfDays = 
    await helpers.calculateDaysBetweenDates(payload.startDate, payload.returnDate);
  const createData: leaveRequestRepository.CreateLeaveRequestObject = {
    employeeId: payload.employeeId,
    leavePackageId,
    startDate: payload.startDate,
    returnDate: payload.returnDate,
    comment: payload.comment,
    status: payload.status,
    numberOfDays
  };
 
  logger.debug('Adding new Leave plan to the database...');

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
    employeeId: queryEmployeeId,
    leavePackageId,
    status,
    'startDate.gte': startDateGte,
    'startDate.lte': startDateLte,
    'returnDate.gte': returnDateGte,
    'returnDate.lte': returnDateLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { employeeId: requestingEmployeeId } = authorizedUser;
  
  let result: ListWithPagination<LeaveRequestDto>;
  try {
    logger.debug('Finding LeaveRequest(s) that matched query', { query });
    result = await leaveRequestRepository.find({
      skip,
      take,
      where: { employeeId: queryEmployeeId === undefined? requestingEmployeeId : queryEmployeeId, 
        leavePackageId, status, startDate: {
          gte: startDateGte && new Date(startDateGte),
          lt: startDateLte && dateutil.getDate(new Date(startDateLte), { days: 1 }),
        }, returnDate: {
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
  id: number, authorizedUser: AuthorizedUser
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
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'LeaveRequest does not exist'
    });
  }

  if (!employeeId || (employeeId !== leaveRequest.employeeId)) {
    throw new UnauthorizedError({});
  }


  logger.info('LeaveRequest[%s] details retrieved!', id);
  return leaveRequest;
}

export async function updateLeaveRequest(
  id: number, 
  updateData: UpdateLeaveRequestDto,
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { leaveTypeId, startDate, returnDate } = updateData;
  const { employeeId } = authorizedUser;
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to update does not exisit'
    });
  }

  if ((employeeId !== leaveRequest.employeeId) || 
    ((leaveRequest.status !== 'PENDING') && (leaveRequest.responsecompletedat === null))
  ) {
    throw new UnauthorizedError({
      message: 'You are not allowed to perform this action'
    });
  }

  // Validation
  if (leaveTypeId) {
    try {
      validate(leaveTypeId);
    } catch (err) {
      logger.warn('Getting LeavePackage[%s] fialed', leaveTypeId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
  }

  let numberOfDays: number;
  if (startDate && returnDate) {
    numberOfDays = await helpers.calculateDaysBetweenDates(startDate, returnDate);
  } else if (startDate) {
    numberOfDays = 
      await helpers.calculateDaysBetweenDates(startDate, leaveRequest.returnDate);
  } else if (returnDate) {
    numberOfDays = 
      await helpers.calculateDaysBetweenDates(leaveRequest.startDate, returnDate);
  } else {
    numberOfDays = leaveRequest.numberOfDays!;
  }
  
  logger.debug('Persisting update(s) to LeaveRequest[%s]', id);
  const updatedLeaveRequest = await leaveRequestRepository.update({
    where: { id }, data: { numberOfDays, ...updateData }, includeRelations: true
  });
  logger.info('Update(s) to LeaveRequest[%s] persisted successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedLeaveRequest;
}

export async function deleteLeaveRequest(id: number): Promise<void> {
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to delete does not exisit'
    });
  }

  logger.debug('Deleting LeaveRequest[%s] from database...', id);
  try {
    await leaveRequestRepository.deleteLeaveRequest({ id });
    logger.info('LeaveRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting LeaveRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}

export async function addLeaveResponse(
  id: number, 
  responseData: ResponseObjectDto,
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { action, comment } = responseData;
  const { employeeId } = authorizedUser;
  let  approvingEmployeeId: number;
  if (employeeId) {
    approvingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to add response to does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to add response to does not exisit'
    });
  } else if (leaveRequest.status !== LEAVE_REQUEST_STATUS.PENDING) {
    throw new UnauthorizedError({ message: 'Can not perform this action' });
  } 

  logger.debug('Adding response to LeaveRequest[%s]', id);
  const updatedLeaveRequest = await leaveRequestRepository.respond({
    where: { id }, data: {
      status: (action === LEAVE_RESPONSE_ACTION.APPROVE) ?
        LEAVE_REQUEST_STATUS.APPROVED : LEAVE_REQUEST_STATUS.DECLINED,
      approvingEmployeeId,
      leaveRequestId: id,
      responseType: (action === LEAVE_RESPONSE_ACTION.APPROVE) ?
        LEAVE_REQUEST_STATUS.APPROVED : LEAVE_REQUEST_STATUS.DECLINED,
      comment
    }
  });
  logger.info('Response added to LeaveRequest[%s] successfully!', id);

  return updatedLeaveRequest;
}

export async function cancelLeaveRequest(
  id: number, 
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { employeeId } = authorizedUser;
  
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] to cancel does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request to cancel does not exisit'
    });
  } else if (leaveRequest.status === LEAVE_REQUEST_STATUS.DECLINED 
    || leaveRequest.status === LEAVE_REQUEST_STATUS.CANCELLED) {
    throw new UnauthorizedError({ message: 'Can not perform this action' });
  }
  const leaveStartDate = new Date(leaveRequest.startDate);
  const todaysDate = new Date();
  if ( leaveStartDate.getTime() >= todaysDate.getTime()) {
    throw new UnauthorizedError({});
  }

  if (!employeeId || (employeeId !== leaveRequest.employeeId)) {
    throw new UnauthorizedError({});
  }

  logger.debug('Cancelling LeaveRequest[%s]', id);
  let newLeaveRequest: LeaveRequestDto;
  try {
    newLeaveRequest = await leaveRequestRepository.cancel({
      where: { id }, updateData: { 
        status: LEAVE_REQUEST_STATUS.CANCELLED, 
        cancelledByEmployeeId: employeeId
      },
    });
    logger.info('LeaveRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting LeaveRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return newLeaveRequest;
}


export type employeLeaveTypeSummaryObject = {
  numberOfDaysAllowed: number,
  numberOfDaysUsed: number,
  numberOfDaysPending: number,
  numberOfDaysLeft: number
}

export async function getEmployeeLeaveTypeSummary(
  employeeId: number, leaveTypeId: number
): Promise<employeLeaveTypeSummaryObject> {
  const leavePackage = await getApplicableLeavePackage(employeeId, leaveTypeId);
  const numberOfDaysAllowed = leavePackage.maxDays;
  const currentYear = new Date().getFullYear();

  const firstDay = new Date(currentYear, 0, 1);

  const lastDay = new Date(currentYear, 11, 31);

  const [leaveRequestStatusApproved, leaveRequestStatusPending] = await Promise.all([
    leaveRequestRepository.find({ where:{
      employeeId, leavePackageId: leavePackage.id, status: LEAVE_REQUEST_STATUS.APPROVED,
      createdAt: {
        gte: firstDay,
        lte: lastDay
      }
    } }),
    leaveRequestRepository.find({ where:{
      employeeId, leavePackageId: leavePackage.id, status: LEAVE_REQUEST_STATUS.PENDING,
      createdAt: {
        gte: firstDay,
        lte: lastDay
      }
    } }),
  ]);
  console.log(leaveRequestStatusPending);

  const numberOfDaysUsed = leaveRequestStatusApproved.data.reduce(
    (accumulator, currentValue) => {
      return accumulator + currentValue.numberOfDays!;
    }, 0);
  const numberOfDaysPending = leaveRequestStatusPending.data.reduce(
    (accumulator, currentValue) => {
      return accumulator + currentValue.numberOfDays!;
    }, 0);

  const numberOfDaysLeft = numberOfDaysAllowed - (numberOfDaysUsed + numberOfDaysPending);

  return { numberOfDaysAllowed, numberOfDaysUsed, numberOfDaysPending, numberOfDaysLeft };
}