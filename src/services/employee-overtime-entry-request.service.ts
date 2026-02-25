import { EmployeeOvertimeEntryRequest, Overtime, Status } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CreateEmployeeOvertimeEntryRequestDto,
  EmployeeOvertimeEntryInputDto,
  EmployeeOvertimeEntryRequestDto,
  QueryEmployeeOvertimeEntryRequestDto,
  UpdateEmployeeOvertimeEntryRequestDto,
} from '../domain/dto/employee-overtime-entry-request.dto';
import * as repository from '../repositories/employee-overtime-entry-request.repository';
import * as employeeService from '../services/employee.service';
import * as payPeriodService from '../services/pay-period.service';
import * as overtimeService from '../services/overtime.service';
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
  sendEmployeeOvertimeEntryRequestEmail, 
  sendEmployeeOvertimeEntryResponseEmail 
} from '../utils/notification.util';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeOvertimeEntryRequestService' });

const events = {
  created: 'event.EmployeeOvertimeEntryRequest.created',
  modified: 'event.EmployeeOvertimeEntryRequest.modified',
  deleted: 'event.EmployeeOvertimeEntryRequest.deleted'
} as const;

export async function addEmployeeOvertimeEntryRequest(
  creatData: CreateEmployeeOvertimeEntryRequestDto,
  authUser: AuthorizedUser
): Promise<EmployeeOvertimeEntryRequestDto> {
  const { employeeId, payPeriodId, overtimeId } = creatData;
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
  // validate employeeId, payPeriod and overtimeId
  let overtime: Overtime | undefined, _, __;
  try {
    [overtime, _, __] =await Promise.all([
      overtimeService.getOvertime(overtimeId),
      employeeService.getEmployee(employeeId),
      payPeriodService.getPayPeriod(payPeriodId),
    ]);
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] or Overtime[%s] failed', 
      employeeId, payPeriodId, overtimeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Dependency checks for all provided ids passed');
 
  logger.debug('Adding new EmployeeOvertimeEntryRequest to the database...');
  let newEmployeeOvertimeEntryRequest: EmployeeOvertimeEntryRequestDto;
  try {
    newEmployeeOvertimeEntryRequest = await repository.create(creatData,
      { 
        employee: true,
        payPeriod: true,
        overtime: true
      }
    );
    logger.info(
      'EmployeeOvertimeEntryRequest[%s] added successfully!', 
      newEmployeeOvertimeEntryRequest.id
    );
  } catch (err) {
    logger.error('Adding EmployeeOvertimeEntryRequest failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'overtime'
  });
    
  for (const x of approvers) {
    if (x.approver && x.approver.email && x.employee) {
      sendEmployeeOvertimeEntryRequestEmail({
        requestId: newEmployeeOvertimeEntryRequest.id,
        approverEmail: x.approver.email,
        approverFirstName: x.approver.firstName,
        employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
        requestDate: newEmployeeOvertimeEntryRequest.createdAt,
        overtimeName: overtime.name,
        employeePhotoUrl: x.employee.photoUrl,
      });
    }
  }

  // Emit event.EmployeeOvertimeEntryRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newEmployeeOvertimeEntryRequest);
  logger.info(`${events.created} event created successfully!`);

  return newEmployeeOvertimeEntryRequest;
}

export async function getEmployeeOvertimeEntryRequests(
  query: QueryEmployeeOvertimeEntryRequestDto,
  user: AuthorizedUser,
): Promise<ListWithPagination<EmployeeOvertimeEntryRequestDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId: qEmployeeId,
    payPeriodId,
    overtimeId,
    companyId,
    queryMode, 
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    user, 
    { employeeId: qEmployeeId, queryMode, companyId },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );

  let result: ListWithPagination<EmployeeOvertimeEntryRequestDto>;
  try {
    logger.debug('Finding EmployeeOvertimeEntryRequest(ies) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery, 
        payPeriodId, 
        overtimeId,
      },
      orderBy: orderByInput,
      include: {
        employee: true,
        payPeriod: true,
        overtime: true
      }
    });
    logger.info(
      'Found %d EmployeeOvertimeEntryRequest(ies) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeOvertimeEntryRequest with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getEmployeeOvertimeEntryRequest(
  id: number,
  authUser: AuthorizedUser
): Promise<EmployeeOvertimeEntryRequestDto> {
  logger.debug('Getting details for EmployeeOvertimeEntryRequest[%s]', id);
  let employeeOvertimeEntryRequest: EmployeeOvertimeEntryRequest | null;
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authUser, 
    { id, queryMode: RequestQueryMode.ALL },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );
  
  try {
    employeeOvertimeEntryRequest = await repository.findFirst(scopedQuery, { 
      employee: true, 
      payPeriod: true,
      overtime: { include: { overtimePaymentTiers: true } }
    });
  } catch (err) {
    logger.warn(
      'Getting EmployeeOvertimeEntryRequest[%s] failed', 
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeOvertimeEntryRequest) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action does not exist'
    });
  }

  logger.info('EmployeeOvertimeEntryRequest[%s] details retrieved!', id);
  return employeeOvertimeEntryRequest;
}

export async function updateEmployeeOvertimeEntryRequest(
  id: number, 
  updateData: UpdateEmployeeOvertimeEntryRequestDto,
  authorizedUser: AuthorizedUser,
): Promise<EmployeeOvertimeEntryRequestDto> {
  const { employeeId, payPeriodId, overtimeId } = updateData;
  const { employeeId: reqEmployeeId,  } = authorizedUser;

  const employeeOvertimeEntryRequest = await repository.findOne({ id });
  if (!employeeOvertimeEntryRequest) {
    logger.warn('EmployeeOvertimeEntryRequest[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action to update does not exisit'
    });
  } else if (reqEmployeeId !== employeeOvertimeEntryRequest.employeeId) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] was not created by Employee[%s]. Update rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (employeeOvertimeEntryRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] cannot be updated due to current status[%s]',
      id, employeeOvertimeEntryRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed due to the current state of the Employee overtime entry request'
    });
  }

  // validate employeeId, payPeriodId and overtime
  try {
    if (employeeId && payPeriodId && overtimeId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId),
        overtimeService.getOvertime(overtimeId)
      ]);
    } else if (employeeId && overtimeId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        overtimeService.getOvertime(overtimeId)
      ]);
    } else if (payPeriodId && overtimeId) {
      await Promise.all([
        payPeriodService.getPayPeriod(payPeriodId),
        overtimeService.getOvertime(overtimeId)
      ]);
    }
    if (employeeId && payPeriodId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId)
      ]);
    } else if (employeeId) {
      await employeeService.getEmployee(employeeId);
    } else if (payPeriodId) {
      await payPeriodService.getPayPeriod(payPeriodId);
    } else if (overtimeId) {
      await overtimeService.getOvertime(overtimeId);
    }
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] or Overtime[%s] failed', 
      employeeId, payPeriodId, overtimeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to EmployeeOvertimeEntryRequest[%s]', id);
  const updatedEmployeeOvertimeEntryRequest = await repository.update({
    where: { id }, 
    data: updateData,
    include: {
      employee: true,
      payPeriod: true,
      overtime: { include: { overtimePaymentTiers: true } }
    }
  });
  logger.info('Update(s) to EmployeeOvertimeEntryRequest[%s] persisted successfully!', id);

  // Emit event.EmployeeOvertimeEntryRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeOvertimeEntryRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeOvertimeEntryRequest;
}

export async function deleteEmployeeOvertimeEntryRequest(
  id: number,
  authUser: AuthorizedUser
): Promise<void> {
  const { employeeId } = authUser;
  const employeeOvertimeEntryRequest = await repository.findOne({ id });
  let deletedEmployeeOvertimeEntryRequest: EmployeeOvertimeEntryRequest | null;
  if (!employeeOvertimeEntryRequest) {
    logger.warn('Employee overtime entry request[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action to delete does not exisit'
    });
  } else if (employeeId !== employeeOvertimeEntryRequest.employeeId) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] was not created by Employee[%s]. Update rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (employeeOvertimeEntryRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] cannot be updated due to current status[%s]',
      id, employeeOvertimeEntryRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed due to the current state of the employee overtime entry request'
    });
  }

  logger.debug('Deleting EmployeeOvertimeEntryRequest[%s] from database...', id);
  try {
    deletedEmployeeOvertimeEntryRequest = await repository.deleteEmployeeOvertimeEntryRequest({ 
      id 
    });
    logger.info('EmployeeOvertimeEntryRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting EmployeeOvertimeEntryRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeOvertimeEntryRequest.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, deletedEmployeeOvertimeEntryRequest);
  logger.info(`${events.deleted} event emitted successfully!`);
}

export async function addEmployeeOvertimeEntryResponse(
  id: number, 
  responseData: EmployeeOvertimeEntryInputDto,
  authUser: AuthorizedUser,
): Promise<EmployeeOvertimeEntryRequestDto> {
  const { employeeId } = authUser;
  let approvingEmployeeId: number;
  if (employeeId) {
    approvingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding EmployeeOvertimeEntryRequest[%s] to respond to', id);
  const employeeOvertimeEntryRequest = await repository.findOne(
    { id },
  );
  if (!employeeOvertimeEntryRequest) {
    logger.warn('EmployeeOvertimeEntryRequest[%s] to add response to does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee Overtime Entry request to add response to does not exist'
    });
  } else if (employeeOvertimeEntryRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] cannot be responded to due to current status[%s]',
      id, employeeOvertimeEntryRequest.status
    );
    throw new InvalidStateError({
      message: 'Response not allowed for this Employee overtime entry request'
    });
  } 
  logger.info('EmployeeOvertimeEntryRequest[%s] exists and can be responded to', id);

  const lastResponse = await repository.findLastResponse(
    { employeeOvertimeEntryRequestId: id }
  );
  const lastLevel = lastResponse ? lastResponse.approverLevel : 0;
  const expectedLevel = lastLevel + 1;
  await helpers.validateResponder({
    authUser, 
    requestorEmployeeId: employeeOvertimeEntryRequest.employeeId, 
  });
  

  logger.debug('Adding response to EmployeeOvertimeEntryRequest[%s]', id);
  const updatedOvertimeEntryRequest = await repository.respond({
    id,
    data: { 
      ...responseData, 
      approvingEmployeeId, 
      finalApproval: employeeOvertimeEntryRequest.approvalsRequired === expectedLevel, 
      approverLevel: expectedLevel 
    },
    include: {
      employee: { include: { company: true } },
      overtime: true
    }
  });
  logger.info('Response added to EmployeeOvertimeEntryRequest[%s] successfully!', id);

  logger.info('Sending notification after successful response to EmployeeOvertimeEntry Request');
  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'overtime'
  });
  const overtimeName = 
    updatedOvertimeEntryRequest.overtime?.name;
  //You have one EmployeeOvertimeEntry request pending approval. See details below.
  if (updatedOvertimeEntryRequest.employee && updatedOvertimeEntryRequest.employee.company) {
    if (updatedOvertimeEntryRequest.employee.company.notifyApproversOnRequestResponse) {
      if (updatedOvertimeEntryRequest.status === Status.PENDING) {
        for (const x of approvers) {
          if (x.approver && x.approver.email && x.employee) {
            sendEmployeeOvertimeEntryResponseEmail({
              requestId: updatedOvertimeEntryRequest.id,
              recipientEmail: x.approver.email,
              recipientFirstName: x.approver.firstName,
              employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
              requestDate: updatedOvertimeEntryRequest.createdAt,
              overtimeName: overtimeName!,
              responseMessage: 
                `EmployeeOvertimeEntry request has been approved at level ${expectedLevel}` + 
                ` pending level ${expectedLevel+1} approval`,
            });
          }
        }
      } else {
        if (updatedOvertimeEntryRequest.status === Status.DECLINED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendEmployeeOvertimeEntryResponseEmail({
                requestId: updatedOvertimeEntryRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedOvertimeEntryRequest.createdAt,
                overtimeName: overtimeName!,
                responseMessage: 
                  `EmployeeOvertimeEntry request has been declined at level ${expectedLevel}`,
              });
            }
          }
          if (updatedOvertimeEntryRequest.employee && updatedOvertimeEntryRequest.employee.email) {
            sendEmployeeOvertimeEntryResponseEmail({
              requestId: updatedOvertimeEntryRequest.id,
              recipientEmail: updatedOvertimeEntryRequest.employee.email,
              recipientFirstName: updatedOvertimeEntryRequest.employee.firstName,
              employeeFullName: 
                `${updatedOvertimeEntryRequest.employee.firstName}`.trim() +
                `${updatedOvertimeEntryRequest.employee.lastName}`.trim(),
              requestDate: updatedOvertimeEntryRequest.createdAt,
              overtimeName: overtimeName!,
              responseMessage: 'Your EmployeeOvertimeEntry request has been declined',
            });
          }
        } else if (updatedOvertimeEntryRequest.status === Status.APPROVED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendEmployeeOvertimeEntryResponseEmail({
                requestId: updatedOvertimeEntryRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedOvertimeEntryRequest.createdAt,
                overtimeName: overtimeName!,
                responseMessage: 'EmployeeOvertimeEntry request has received final approval',
              });
            }
          }
          if (updatedOvertimeEntryRequest.employee && updatedOvertimeEntryRequest.employee.email) {
            sendEmployeeOvertimeEntryResponseEmail({
              requestId: updatedOvertimeEntryRequest.id,
              recipientEmail: updatedOvertimeEntryRequest.employee.email,
              recipientFirstName: updatedOvertimeEntryRequest.employee.firstName,
              employeeFullName: 
                `${updatedOvertimeEntryRequest.employee.firstName}`.trim() +
                `${updatedOvertimeEntryRequest.employee.lastName}`.trim(),
              requestDate: updatedOvertimeEntryRequest.createdAt,
              overtimeName: overtimeName!,
              responseMessage: 'Your EmployeeOvertimeEntry request has been approved',
            });
          }
        }
      }
    } else {
      if (updatedOvertimeEntryRequest.status === Status.APPROVED) {
        if (updatedOvertimeEntryRequest.employee && updatedOvertimeEntryRequest.employee.email) {
          sendEmployeeOvertimeEntryResponseEmail({
            requestId: updatedOvertimeEntryRequest.id,
            recipientEmail: updatedOvertimeEntryRequest.employee.email,
            recipientFirstName: updatedOvertimeEntryRequest.employee.firstName,
            employeeFullName: 
              `${updatedOvertimeEntryRequest.employee.firstName}`.trim() +
              `${updatedOvertimeEntryRequest.employee.lastName}`.trim(),
            requestDate: updatedOvertimeEntryRequest.createdAt,
            overtimeName: overtimeName!,
            responseMessage: 'Your EmployeeOvertimeEntry request has been approved',
          });
        }
      }
    }
  }
  

  // Emit event.EmployeeOvertimeEntryRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedOvertimeEntryRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedOvertimeEntryRequest;
}

export async function cancelEmployeeOvertimeEntryRequest(
  id: number, 
  authorizedUser: AuthorizedUser,
): Promise<EmployeeOvertimeEntryRequestDto> {
  const { employeeId } = authorizedUser;
  
  logger.debug('Finding EmployeeOvertimeEntryRequest[%s] to cancel', id);
  const employeeOvertimeEntryRequest = await repository.findOne({ id });
  if (!employeeOvertimeEntryRequest) {
    logger.warn('EmployeeOvertimeEntryRequest[%s] to cancel does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_REQUEST_NOT_FOUND,
      message: 'Employee overtime entry request to cancel does not exisit'
    });
  } else if (employeeOvertimeEntryRequest.status !== Status.PENDING) {
    logger.warn(
      'EmployeeOvertimeEntryReqeust[%s] cannot be cancelled due to current status[%s]',
      id, employeeOvertimeEntryRequest.status
    );
    throw new InvalidStateError({
      message: 'Employee overtime entry request cannot be cancelled'
    });
  }
  logger.info('EmployeeOvertimeEntryRequest[%s] exists and can be cancelled', id);

  // TODO: Check if authUser employee is an HR employee
  if (!employeeId || employeeId !== employeeOvertimeEntryRequest.employeeId) {
    logger.warn(
      'EmployeeOvertimeEntryRequest[%s] can only be cancelled by Employee[%s] or HR employee',
      id, employeeOvertimeEntryRequest.employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to cancel this Employee overtime entry request'
    });
  }

  logger.debug('Cancelling EmployeeOvertimeEntryRequest[%s]', id);
  let cancelledEmployeeOvertimeEntryRequest: EmployeeOvertimeEntryRequestDto;
  try {
    cancelledEmployeeOvertimeEntryRequest = await repository.cancel({
      id,
      cancelledByEmployeeId: employeeId,
    });
    logger.info('EmployeeOvertimeEntryRequest[%s] cancelled successfully', id);
  } catch (err) {
    logger.error('Cancelling EmployeeOvertimeEntryRequest[%] failed', id, { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeOvertimeEntryRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, cancelledEmployeeOvertimeEntryRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return cancelledEmployeeOvertimeEntryRequest;
}