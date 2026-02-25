import { EmployeeWorkTimeRequest, Status } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CreateEmployeeWorkTimeRequestDto, 
  EmployeeWorkTimeInputDto, 
  EmployeeWorkTimeRequestDto,
  QueryEmployeeWorkTimeRequestDto,
  UpdateEmployeeWorkTimeRequestDto,
} from '../domain/dto/employee-work-time-request.dto';
import * as repository from '../repositories/employee-work-time-request.repository';
import * as employeeService from '../services/employee.service';
import * as payPeriodService from '../services/pay-period.service';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  FailedDependencyError, 
  ForbiddenError, 
  HttpError, 
  InvalidStateError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import { getEmployeeApproversWithDefaults } from './employee-approver.service';
import { 
  sendEmployeeWorkTimeRequestEmail, 
  sendEmployeeWorkTimeResponseEmail 
} from '../utils/notification.util';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeWorkTimeRequestService' });

const events = {
  created: 'event.EmployeeWorkTimeRequest.created',
  modified: 'event.EmployeeWorkTimeRequest.modified',
  deleted: 'event.EmployeeWorkTimeRequest.deleted'
} as const;

export async function addEmployeeWorkTimeRequest(
  creatData: CreateEmployeeWorkTimeRequestDto,
  authUser: AuthorizedUser
): Promise<EmployeeWorkTimeRequestDto> {
  const { employeeId, payPeriodId } = creatData;
  const { employeeId: reqEmployeeId, category } = authUser;
  const allowedUsers = [UserCategory.HR, UserCategory.OPERATIONS];
  if ((reqEmployeeId !== employeeId) && (!allowedUsers.includes(category))) {
    logger.warn(
      'Employee overtime entry request was not created by Employee[%s], an HR employee ' 
        + 'or an OPERATIONS user. Create rejected',
      employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to create EmployeeOvertimeEntry request for another employee'
    });
  }

  // validate employeeId and payPeriod
  try {
    await Promise.all([
      employeeService.getEmployee(employeeId),
      payPeriodService.getPayPeriod(payPeriodId)
    ]);
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] failed', 
      employeeId, payPeriodId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Dependency checks for all provided ids passed');
 
  logger.debug('Adding new EmployeeWorkTimeRequest to the database...');
  let newEmployeeWorkTimeRequest: EmployeeWorkTimeRequest;
  try {
    newEmployeeWorkTimeRequest = await repository.create(creatData,
      { 
        employee: true,
        payPeriod: true
      }
    );
    logger.info('EmployeeWorkTimeRequest[%s] added successfully!', newEmployeeWorkTimeRequest.id);
  } catch (err) {
    logger.error('Adding EmployeeWorkTimeRequest failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'workTime'
  });
      
  for (const x of approvers) {
    if (x.approver && x.approver.email && x.employee) {
      sendEmployeeWorkTimeRequestEmail({
        requestId: newEmployeeWorkTimeRequest.id,
        approverEmail: x.approver.email,
        approverFirstName: x.approver.firstName,
        employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
        requestDate: newEmployeeWorkTimeRequest.createdAt,
        timeUnit: newEmployeeWorkTimeRequest.timeUnit,
        timeValue: newEmployeeWorkTimeRequest.timeValue,
        employeePhotoUrl: x.employee.photoUrl,
      });
    }
  }

  // Emit event.EmployeeWorkTimeRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newEmployeeWorkTimeRequest);
  logger.info(`${events.created} event created successfully!`);

  return newEmployeeWorkTimeRequest;
}

export async function getEmployeeWorkTimeRequests(
  query: QueryEmployeeWorkTimeRequestDto,
  user: AuthorizedUser,
): Promise<ListWithPagination<EmployeeWorkTimeRequestDto>> {
  const {
    page,
    limit: take,
    orderBy,
    payPeriodId,
    timeUnit,
    employeeId: qEmployeeId,
    queryMode,
    companyId
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    user, 
    { employeeId: qEmployeeId, queryMode, companyId },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );

  let result: ListWithPagination<EmployeeWorkTimeRequestDto>;
  try {
    logger.debug('Finding EmployeeWorkTimeRequest(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery, 
        payPeriodId, 
        timeUnit,
      },
      orderBy: orderByInput,
      include: {
        employee: true,
        payPeriod: true
      }
    });
    logger.info(
      'Found %d EmployeeWorkTimeRequest(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeWorkTimeRequest with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getEmployeeWorkTimeRequest(
  id: number,
  authUser: AuthorizedUser
): Promise<EmployeeWorkTimeRequestDto> {
  logger.debug('Getting details for EmployeeWorkTimeRequest[%s]', id);
  let employeeWorkTimeRequest: EmployeeWorkTimeRequest | null;
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authUser, 
    { id, queryMode: RequestQueryMode.ALL },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );

  try {
    employeeWorkTimeRequest = await repository.findFirst(
      scopedQuery, 
      { employee: true, payPeriod: true }
    );
  } catch (err) {
    logger.warn('Getting EmployeeWorkTimeRequest[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeWorkTimeRequest) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action does not exist'
    });
  }

  logger.info('EmployeeWorkTimeRequest[%s] details retrieved!', id);
  return employeeWorkTimeRequest;
}

export async function updateEmployeeWorkTimeRequest(
  id: number, 
  updateData: UpdateEmployeeWorkTimeRequestDto,
  authUser: AuthorizedUser
): Promise<EmployeeWorkTimeRequestDto> {
  const { employeeId, payPeriodId } = updateData;
  const { employeeId: reqEmployeeId,  } = authUser;

  const employeeWorkTimeRequest = await repository.findOne({ id });
  if (!employeeWorkTimeRequest) {
    logger.warn('EmployeeWorkTimeRequest[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action to update does not exisit'
    });
  } else if (reqEmployeeId !== employeeWorkTimeRequest.employeeId) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] was not created by Employee[%s]. Update rejected',
      id, reqEmployeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (employeeWorkTimeRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] cannot be updated due to current status[%s]',
      id, employeeWorkTimeRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed due to the current state of the Employee overtime entry request'
    });
  }
  

  // validate employeeId and payPeriodId
  try {
    if (employeeId && payPeriodId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId)
      ]);
    } else if (employeeId) {
      await employeeService.getEmployee(employeeId);
    } else if (payPeriodId) {
      await payPeriodService.getPayPeriod(payPeriodId);
    }
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] failed', 
      employeeId, payPeriodId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to EmployeeWorkTimeRequest[%s]', id);
  const updatedEmployeeWorkTimeRequest = await repository.update({
    where: { id }, 
    data: updateData,
    include: {
      employee: true,
      payPeriod: true
    }
  });
  logger.info('Update(s) to EmployeeWorkTimeRequest[%s] persisted successfully!', id);

  // Emit event.EmployeeWorkTimeRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeWorkTimeRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeWorkTimeRequest;
}

export async function deleteEmployeeWorkTimeRequest(
  id: number,
  authUser: AuthorizedUser
): Promise<void> {
  const { employeeId } = authUser;
  
  const employeeWorkTimeRequest = await repository.findOne({ id });
  let deletedEmployeeWorkTimeRequest: EmployeeWorkTimeRequest | null;
  if (!employeeWorkTimeRequest) {
    logger.warn('EmployeeWorkTimeRequest[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action to delete does not exisit'
    });
  } else if (employeeId !== employeeWorkTimeRequest.employeeId) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] was not created by Employee[%s]. Update rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (employeeWorkTimeRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] cannot be updated due to current status[%s]',
      id, employeeWorkTimeRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed due to the current state of the employee work time request'
    });
  }

  logger.debug('Deleting EmployeeWorkTimeRequest[%s] from database...', id);
  try {
    deletedEmployeeWorkTimeRequest = await repository.deleteEmployeeWorkTimeRequest({ id });
    logger.info('EmployeeWorkTimeRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting EmployeeWorkTimeRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeWorkTimeRequest.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, deletedEmployeeWorkTimeRequest);
  logger.info(`${events.deleted} event emitted successfully!`);
}

export async function addEmployeeWorkTimeResponse(
  id: number, 
  responseData: EmployeeWorkTimeInputDto,
  authUser: AuthorizedUser,
): Promise<EmployeeWorkTimeRequestDto> {
  const { employeeId } = authUser;
  let approvingEmployeeId: number;
  if (employeeId) {
    approvingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding EmployeeWorkTimeRequest[%s] to respond to', id);
  const employeeWorkTimeRequest = await repository.findOne(
    { id },
  );
  if (!employeeWorkTimeRequest) {
    logger.warn('EmployeeWorkTimeRequest[%s] to add response to does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_REQUEST_NOT_FOUND,
      message: 'Employee work time request to add response to does not exist'
    });
  } else if (employeeWorkTimeRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] cannot be responded to due to current status[%s]',
      id, employeeWorkTimeRequest.status
    );
    throw new InvalidStateError({
      message: 'Response not allowed for this Employee work time request'
    });
  } 
  
  logger.info('EmployeeWorkTimeRequest[%s] exists and can be responded to', id);

  const lastResponse = await repository.findLastResponse(
    { employeeWorkTimeRequestId: id }
  );
  const lastLevel = lastResponse ? lastResponse.approverLevel : 0;
  const expectedLevel = lastLevel + 1;
  await helpers.validateResponder({
    authUser, 
    requestorEmployeeId: employeeWorkTimeRequest.employeeId, 
    expectedLevel,
  });
  

  logger.debug('Adding response to EmployeeWorkTimeRequest[%s]', id);
  const updatedWorkTimeRequest = await repository.respond({
    id,
    data: { 
      ...responseData, 
      approvingEmployeeId, 
      finalApproval: employeeWorkTimeRequest.approvalsRequired === expectedLevel, 
      approverLevel: expectedLevel 
    },
    include: {
      employee: { include: { company: true } },
      payPeriod: true
    }
  });
  logger.info('Response added to EmployeeWorkTimeRequest[%s] successfully!', id);

  logger.info('Sending notification after successful response to EmployeeWorkTime Request');
  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'workTime'
  });
  //You have one EmployeeWorkTime request pending approval. See details below.
  if (updatedWorkTimeRequest.employee && updatedWorkTimeRequest.employee.company) {
    if (updatedWorkTimeRequest.employee.company.notifyApproversOnRequestResponse) {
      if (updatedWorkTimeRequest.status === Status.PENDING) {
        for (const x of approvers) {
          if (x.approver && x.approver.email && x.employee) {
            sendEmployeeWorkTimeResponseEmail({
              requestId: updatedWorkTimeRequest.id,
              recipientEmail: x.approver.email,
              recipientFirstName: x.approver.firstName,
              employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
              requestDate: updatedWorkTimeRequest.createdAt,
              timeUnit: updatedWorkTimeRequest.timeUnit,
              timeValue: updatedWorkTimeRequest.timeValue,
              responseMessage: 
                `EmployeeWorkTime request has been approved at level ${expectedLevel}` + 
                ` pending level ${expectedLevel+1} approval`,
            });
          }
        }
      } else {
        if (updatedWorkTimeRequest.status === Status.DECLINED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendEmployeeWorkTimeResponseEmail({
                requestId: updatedWorkTimeRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedWorkTimeRequest.createdAt,
                timeUnit: updatedWorkTimeRequest.timeUnit,
                timeValue: updatedWorkTimeRequest.timeValue,
                responseMessage: 
                  `EmployeeWorkTime request has been declined at level ${expectedLevel}`,
              });
            }
          }
          if (updatedWorkTimeRequest.employee && updatedWorkTimeRequest.employee.email) {
            sendEmployeeWorkTimeResponseEmail({
              requestId: updatedWorkTimeRequest.id,
              recipientEmail: updatedWorkTimeRequest.employee.email,
              recipientFirstName: updatedWorkTimeRequest.employee.firstName,
              employeeFullName: 
                `${updatedWorkTimeRequest.employee.firstName}`.trim() +
                `${updatedWorkTimeRequest.employee.lastName}`.trim(),
              requestDate: updatedWorkTimeRequest.createdAt,
              timeUnit: updatedWorkTimeRequest.timeUnit,
              timeValue: updatedWorkTimeRequest.timeValue,
              responseMessage: 'Your EmployeeWorkTime request has been declined',
            });
          }
        } else if (updatedWorkTimeRequest.status === Status.APPROVED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendEmployeeWorkTimeResponseEmail({
                requestId: updatedWorkTimeRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedWorkTimeRequest.createdAt,
                timeUnit: updatedWorkTimeRequest.timeUnit,
                timeValue: updatedWorkTimeRequest.timeValue,
                responseMessage: 'EmployeeWorkTime request has received final approval',
              });
            }
          }
          if (updatedWorkTimeRequest.employee && updatedWorkTimeRequest.employee.email) {
            sendEmployeeWorkTimeResponseEmail({
              requestId: updatedWorkTimeRequest.id,
              recipientEmail: updatedWorkTimeRequest.employee.email,
              recipientFirstName: updatedWorkTimeRequest.employee.firstName,
              employeeFullName: 
                `${updatedWorkTimeRequest.employee.firstName}`.trim() +
                `${updatedWorkTimeRequest.employee.lastName}`.trim(),
              requestDate: updatedWorkTimeRequest.createdAt,
              timeUnit: updatedWorkTimeRequest.timeUnit,
              timeValue: updatedWorkTimeRequest.timeValue,
              responseMessage: 'Your EmployeeWorkTime request has been approved',
            });
          }
        }
      }
    } else {
      if (updatedWorkTimeRequest.status === Status.APPROVED) {
        if (updatedWorkTimeRequest.employee && updatedWorkTimeRequest.employee.email) {
          sendEmployeeWorkTimeResponseEmail({
            requestId: updatedWorkTimeRequest.id,
            recipientEmail: updatedWorkTimeRequest.employee.email,
            recipientFirstName: updatedWorkTimeRequest.employee.firstName,
            employeeFullName: 
              `${updatedWorkTimeRequest.employee.firstName}`.trim() +
              `${updatedWorkTimeRequest.employee.lastName}`.trim(),
            requestDate: updatedWorkTimeRequest.createdAt,
            timeUnit: updatedWorkTimeRequest.timeUnit,
            timeValue: updatedWorkTimeRequest.timeValue,
            responseMessage: 'Your EmployeeWorkTime request has been approved',
          });
        }
      }
    }
  }
  

  // Emit event.EmployeeWorkTimeRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedWorkTimeRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedWorkTimeRequest;
}

export async function cancelEmployeeWorkTimeRequest(
  id: number, 
  authorizedUser: AuthorizedUser,
): Promise<EmployeeWorkTimeRequestDto> {
  const { employeeId } = authorizedUser;
  
  logger.debug('Finding EmployeeWorkTimeRequest[%s] to cancel', id);
  const employeeWorkTimeRequest = await repository.findOne({ id });
  if (!employeeWorkTimeRequest) {
    logger.warn('EmployeeWorkTimeRequest[%s] to cancel does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_REQUEST_NOT_FOUND,
      message: 'Employee work time request to cancel does not exisit'
    });
  } else if (employeeWorkTimeRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeWorkTimeReqeust[%s] cannot be cancelled due to current status[%s]',
      id, employeeWorkTimeRequest.status
    );
    throw new InvalidStateError({
      message: 'Employee work time request cannot be cancelled'
    });
  }
  logger.info('EmployeeWorkTimeRequest[%s] exists and can be cancelled', id);

  // TODO: Check if authUser employee is an HR employee
  if (!employeeId || employeeId !== employeeWorkTimeRequest.employeeId) {
    logger.warn(
      'EmployeeWorkTimeRequest[%s] can only be cancelled by Employee[%s] or HR employee',
      id, employeeWorkTimeRequest.employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to cancel this Employee work time request'
    });
  }

  logger.debug('Cancelling EmployeeWorkTimeRequest[%s]', id);
  let cancelledEmployeeWorkTimeRequest: EmployeeWorkTimeRequestDto;
  try {
    cancelledEmployeeWorkTimeRequest = await repository.cancel({
      id,
      cancelledByEmployeeId: employeeId,
    });
    logger.info('EmployeeWorkTimeRequest[%s] cancelled successfully', id);
  } catch (err) {
    logger.error('Cancelling EmployeeWorkTimeRequest[%] failed', id, { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeWorkTimeRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, cancelledEmployeeWorkTimeRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return cancelledEmployeeWorkTimeRequest;
}