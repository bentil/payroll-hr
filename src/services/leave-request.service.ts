import {
  LEAVE_REQUEST_STATUS,
  LeaveRequest,
  LeaveType,
  PayrollCompany,
  Prisma,
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  AdjustDaysDto,
  ConvertLeavePlanToRequestDto,
  CreateLeaveRequestDto,
  EmployeeLeavePackageObject,
  EmployeeLeaveTakenReportObject,
  FilterLeaveRequestForExportDto,
  LeaveBalanceReportLeavePackageObject,
  LeaveBalanceReportLeaveTypeObject,
  LeaveBalanceReportObject,
  LeaveRequestDto,
  LeaveResponseInputDto,
  LeaveTakenReportDepartmentObject,
  LeaveTakenReportEmployeeObject,
  LeaveTakenReportObject,
  LeaveTakenWithPackageReportObject,
  QueryLeaveRequestDto,
  QueryLeaveRequestForReportDto,
  RequestQueryMode,
  UpdateLeaveRequestDto,
  UploadLeaveRequestCheckedRecords,
  UploadLeaveRequestResponse,
  UploadLeaveRequestViaSpreadsheetDto,
} from '../domain/dto/leave-request.dto';
import {
  LeavePackageDto
} from '../domain/dto/leave-package.dto';
import {
  EmployeLeaveTypeSummary,
  ValidationReturnObject
} from '../domain/dto/leave-type.dto';
import { EmployeeDto } from '../domain/events/employee.event';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import { 
  FailedDependencyError,
  ForbiddenError,
  HttpError,
  InputError,
  InvalidStateError,
  NotFoundError,
  RequirementNotMetError,
  ServerError,
} from '../errors/http-errors';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import * as employeeRepository from '../repositories/employee.repository';
import * as leaveRequestRepository from '../repositories/leave-request.repository';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { sendLeaveRequestEmail, sendLeaveResponseEmail } from '../utils/notification.util';
import { getEmployeeApproversWithDefaults } from './employee-approver.service';
import * as employeeService from './employee.service';
import { countWorkingDays } from './holiday.service';
import { getApplicableLeavePackage } from './leave-package.service';
import * as leaveTypeService from './leave-type.service';
import * as leavePlanService from './leave-plan.service';
import * as leaveTypeRepository from '../repositories/leave-type';
import * as companyRepository from '../repositories/payroll-company.repository';
import * as Excel from 'exceljs';
import * as departmentRepository from '../repositories/department.repository';
import * as leavePackageRepository from '../repositories/leave-package';
import * as companyService from './payroll-company.service';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'LeaveRequestService' });
const events = {
  created: 'event.LeaveRequest.created',
  modified: 'event.LeaveRequest.modified',
  deleted: 'event.LeaveRequest.deleted',
} as const;
const workbook = new Excel.Workbook();

export async function addLeaveRequest(
  payload: CreateLeaveRequestDto,
  authUser: AuthorizedUser
): Promise<LeaveRequestDto> {
  const { employeeId, leaveTypeId, startDate } = payload;
  const { employeeId: reqEmployeeId, category, organizationId } = authUser;
  const allowedUsers = [UserCategory.HR, UserCategory.OPERATIONS];
  if ((reqEmployeeId !== employeeId) && (!allowedUsers.includes(category))) {
    logger.warn(
      'LeaveRequest was not created by Employee[%s], an HR employee or an OPERATIONS user.' 
      + 'Create rejected',
      employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to create leave request for another employee'
    });
  }
  const currentDate = new Date().getTime();
  const leaveStartDate = new Date(startDate).getTime();
  if (leaveStartDate < currentDate && category !== UserCategory.HR) {
    logger.warn(
      'LeaveRequest can not start before today. Create rejected',
      employeeId
    );
    throw new InputError({
      message: 'You can not create a leave request with a start date in the past'
    });
  }

  let validateData: ValidationReturnObject,
    leaveSummary: EmployeLeaveTypeSummary,
    employee: EmployeeDto,
    leaveType: LeaveType;
  try {
    [validateData, leaveSummary, employee, leaveType] = await Promise.all([
      leaveTypeService.validate({ leaveTypeId, employeeId }),
      getEmployeeLeaveTypeSummary(employeeId, leaveTypeId),
      employeeService.getEmployee(employeeId, { includeCompany: true }),
      leaveTypeService.getLeaveTypeById(leaveTypeId)
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

  const { leavePackageId, considerPublicHolidayAsWorkday, considerWeekendAsWorkday } = validateData;

  const numberOfDays = await countWorkingDays({ 
    startDate: payload.startDate, 
    endDate: payload.returnDate, 
    considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday,
    organizationId
  });

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
    numberOfDays,
    approvalsRequired: employee.company!.leaveRequestApprovalsRequired
  };
 
  logger.debug('Adding new LeaveRequest to the database...');

  let newLeaveRequest: LeaveRequest;
  try {
    newLeaveRequest = await leaveRequestRepository.create(
      createData, 
      { employee: true, leavePackage: { include: { leaveType: true } } }
    );
    logger.info('LeaveRequest[%s] added successfully!', newLeaveRequest.id);
  } catch (err) {
    logger.error('Adding LeaveRequest failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'leave'
  });
  
  for (const x of approvers) {
    if (x.approver && x.approver.email && x.employee) {
      sendLeaveRequestEmail({
        requestId: newLeaveRequest.id,
        approverEmail: x.approver.email,
        approverFirstName: x.approver.firstName,
        employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
        requestDate: newLeaveRequest.createdAt,
        startDate: newLeaveRequest.startDate,
        endDate: newLeaveRequest.returnDate,
        leaveTypeName: leaveType.name,
        employeePhotoUrl: x.employee.photoUrl,
      });
    }
  }

  // Emit event.LeaveRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newLeaveRequest);
  logger.info(`${events.created} event created successfully!`);

  return newLeaveRequest;
}

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
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authorizedUser, 
    { employeeId: qEmployeeId, queryMode }, 
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );
  let include: Prisma.LeaveRequestInclude;
  if (queryMode !== RequestQueryMode.SELF) {
    include = {
      leavePackage: {
        include: { leaveType: true }
      },
      employee: true,
    };
  } else {
    include = {
      leavePackage: {
        include: { leaveType: true }
      },
    };
  }

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
      include
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
  authorizedUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authorizedUser, 
    { id, queryMode: RequestQueryMode.ALL },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );

  logger.debug('Getting details for LeaveRequest[%s]', id);
  let leaveRequest: LeaveRequestDto | null;
  try {
    leaveRequest = await leaveRequestRepository.findFirst(scopedQuery, {
      employee: true, leavePackage: { include: { leaveType: true } } 
    });
  } catch (err) {
    logger.warn('Getting LeaveRequest[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leaveRequest) {
    logger.warn('LeaveRequest[%s] does not exist', id);
    throw new NotFoundError({
      name: errors.LEAVE_REQUEST_NOT_FOUND,
      message: 'Leave request not found'
    });
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
  const { employeeId, organizationId } = authorizedUser;

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
  let leavePackageId: number | undefined,
    considerPublicHolidayAsWorkday: boolean | undefined,
    considerWeekendAsWorkday: boolean | undefined;
  if (leaveTypeId) {
    logger.debug(
      'Fetching applicable LeavePackage of LeaveType[%s] for Employee[%s]',
      leaveTypeId, employeeId
    );
    const validateData = await leaveTypeService.validate({
      leaveTypeId,
      employeeId,
    });
    leavePackageId = validateData.leavePackageId;
    considerPublicHolidayAsWorkday = validateData.considerPublicHolidayAsWorkday;
    considerWeekendAsWorkday = validateData.considerWeekendAsWorkday;
    logger.info(
      'Obtained applicable LeavePackage of LeaveType[%s] for Employee[%s]',
      leaveTypeId, employeeId
    );
  } else {
    const employee = await employeeRepository.findOne(
      { id: employeeId },
      {
        majorGradeLevel: { include: { companyLevel: true } },
        company: true,
      },
    );
    considerPublicHolidayAsWorkday = employee?.company?.considerPublicHolidayAsWorkday;
    considerWeekendAsWorkday = employee?.company?.considerWeekendAsWorkday;
  }

  let numberOfDays: number | undefined;
  if (startDate && returnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate, 
      endDate: returnDate, 
      considerPublicHolidayAsWorkday,
      considerWeekendAsWorkday,
      organizationId
    });
  } else if (startDate) {
    numberOfDays = await countWorkingDays({ 
      startDate, 
      endDate: leaveRequest.returnDate, 
      considerPublicHolidayAsWorkday,
      considerWeekendAsWorkday,
      organizationId
    });
  } else if (returnDate) {
    numberOfDays = await countWorkingDays({ 
      startDate: leaveRequest.startDate, 
      endDate: returnDate, 
      considerPublicHolidayAsWorkday,
      considerWeekendAsWorkday,
      organizationId
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
    include: {
      leavePackage: { include: { leaveType: true } }
    },
  });
  logger.info('Update(s) to LeaveRequest[%s] persisted successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedLeaveRequest;
}

export async function deleteLeaveRequest(
  id: number,
  authorizedUser: AuthorizedUser,
): Promise<void> {
  const { employeeId } = authorizedUser;
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
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  } else if (employeeId !== leaveRequest.employeeId) {
    logger.warn(
      'LeaveRequest[%s] was not created by Employee[%s]. Delete rejected',
      id, employeeId
    );
    throw new ForbiddenError({
      message: 'You are not allowed to perform this action'
    });
  }

  logger.debug('Deleting LeaveRequest[%s] from database...', id);
  try {
    await leaveRequestRepository.deleteOne({ id });
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
  authUser: AuthorizedUser,
): Promise<LeaveRequestDto> {
  const { employeeId } = authUser;
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

  const lastResponse = await leaveRequestRepository.findLastResponse(
    { leaveRequestId: id }
  );
  const lastLevel = lastResponse ? lastResponse.approverLevel : 0;
  const expectedLevel = lastLevel + 1;
  await helpers.validateResponder({
    authUser, 
    requestorEmployeeId: leaveRequest.employeeId, 
    expectedLevel, 
  });

  logger.debug('Adding response to LeaveRequest[%s]', id);
  const updatedLeaveRequest = await leaveRequestRepository.respond({
    id,
    data: { 
      ...responseData, 
      approvingEmployeeId, 
      finalApproval: leaveRequest.approvalsRequired === expectedLevel, 
      approverLevel: expectedLevel 
    },
    include: { 
      leavePackage: { include: { leaveType: true } },
      leaveResponses: true,
      employee: { include: { company: true } }
    } 
  });
  logger.info('Response added to LeaveRequest[%s] successfully!', id);

  logger.info('Sending notification after successful response to leave Request');
  const approvers = await getEmployeeApproversWithDefaults({
    employeeId,
    approvalType: 'leave'
  });
  const leaveType = updatedLeaveRequest.leavePackage?.leaveType;
  //You have one leave request pending approval. See details below.
  if (updatedLeaveRequest.employee && updatedLeaveRequest.employee.company) {
    if (updatedLeaveRequest.employee.company.notifyApproversOnRequestResponse) {
      if (updatedLeaveRequest.status === LEAVE_REQUEST_STATUS.PENDING) {
        for (const x of approvers) {
          if (x.approver && x.approver.email && x.employee) {
            sendLeaveResponseEmail({
              requestId: updatedLeaveRequest.id,
              recipientEmail: x.approver.email,
              recipientFirstName: x.approver.firstName,
              employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
              requestDate: updatedLeaveRequest.createdAt,
              startDate: updatedLeaveRequest.startDate,
              endDate: updatedLeaveRequest.returnDate,
              leaveTypeName: leaveType!.name,
              responseMessage: 
                `Leave request has been approved at level ${expectedLevel}` + 
                ` pending level ${expectedLevel+1} approval`,
            });
          }
        }
      } else {
        if (updatedLeaveRequest.status === LEAVE_REQUEST_STATUS.DECLINED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendLeaveResponseEmail({
                requestId: updatedLeaveRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedLeaveRequest.createdAt,
                startDate: updatedLeaveRequest.startDate,
                endDate: updatedLeaveRequest.returnDate,
                leaveTypeName: leaveType!.name,
                responseMessage: `Leave request has been declined at level ${expectedLevel}`,
              });
            }
          }
          if (updatedLeaveRequest.employee && updatedLeaveRequest.employee.email) {
            sendLeaveResponseEmail({
              requestId: updatedLeaveRequest.id,
              recipientEmail: updatedLeaveRequest.employee.email,
              recipientFirstName: updatedLeaveRequest.employee.firstName,
              employeeFullName: 
                `${updatedLeaveRequest.employee.firstName}`.trim() +
                `${updatedLeaveRequest.employee.lastName}`.trim(),
              requestDate: updatedLeaveRequest.createdAt,
              startDate: updatedLeaveRequest.startDate,
              endDate: updatedLeaveRequest.returnDate,
              leaveTypeName: leaveType!.name,
              responseMessage: 'Your leave request has been declined',
            });
          }
        } else if (updatedLeaveRequest.status === LEAVE_REQUEST_STATUS.APPROVED) {
          for (const x of approvers) {
            if (x.approver && x.approver.email && x.employee) {
              sendLeaveResponseEmail({
                requestId: updatedLeaveRequest.id,
                recipientEmail: x.approver.email,
                recipientFirstName: x.approver.firstName,
                employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                requestDate: updatedLeaveRequest.createdAt,
                startDate: updatedLeaveRequest.startDate,
                endDate: updatedLeaveRequest.returnDate,
                leaveTypeName: leaveType!.name,
                responseMessage: 'Leave request has received final approval',
              });
            }
          }
          if (updatedLeaveRequest.employee && updatedLeaveRequest.employee.email) {
            sendLeaveResponseEmail({
              requestId: updatedLeaveRequest.id,
              recipientEmail: updatedLeaveRequest.employee.email,
              recipientFirstName: updatedLeaveRequest.employee.firstName,
              employeeFullName: 
                `${updatedLeaveRequest.employee.firstName}`.trim() +
                `${updatedLeaveRequest.employee.lastName}`.trim(),
              requestDate: updatedLeaveRequest.createdAt,
              startDate: updatedLeaveRequest.startDate,
              endDate: updatedLeaveRequest.returnDate,
              leaveTypeName: leaveType!.name,
              responseMessage: 'Your leave request has been approved',
            });
          }
        }
      }
    } else {
      if (updatedLeaveRequest.status === LEAVE_REQUEST_STATUS.APPROVED) {
        if (updatedLeaveRequest.employee && updatedLeaveRequest.employee.email) {
          sendLeaveResponseEmail({
            requestId: updatedLeaveRequest.id,
            recipientEmail: updatedLeaveRequest.employee.email,
            recipientFirstName: updatedLeaveRequest.employee.firstName,
            employeeFullName: 
              `${updatedLeaveRequest.employee.firstName}`.trim() +
              `${updatedLeaveRequest.employee.lastName}`.trim(),
            requestDate: updatedLeaveRequest.createdAt,
            startDate: updatedLeaveRequest.startDate,
            endDate: updatedLeaveRequest.returnDate,
            leaveTypeName: leaveType!.name,
            responseMessage: 'Your leave request has been approved',
          });
        }
      }
    }
  }
  

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
      include: {
        leavePackage: { include: { leaveType: true } }
      },
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
  const allowedUsers = [UserCategory.HR, UserCategory.OPERATIONS];
  
  logger.debug('Finding LeaveRequest[%s] to adjust', id);
  const leaveRequest = await leaveRequestRepository.findOne({ id });
  // check for employee being an hr
  if(!allowedUsers.includes(category)) {
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
    },
    include: {
      leavePackage: {
        include: { leaveType: true }
      },
      leaveResponses: true
    }
  });
  logger.info('Number of days adjusted for LeaveRequest[%s] successfully!', id);

  // Emit event.LeaveRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, adjustedLeaveRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return adjustedLeaveRequest;
}

export async function convertLeavePlanToRequest(
  convertData: ConvertLeavePlanToRequestDto,
  authorizedUser: AuthorizedUser
): Promise<LeaveRequestDto> {
  const { leavePlanId } = convertData;
  const { organizationId } = authorizedUser;
  
  logger.debug('Finding leavePlan[%s] to convert', leavePlanId);
  const leavePlan = await leavePlanService.getLeavePlan(
    leavePlanId,
    authorizedUser,
    { queryMode: RequestQueryMode.SELF }
  );
  if (!leavePlan) {
    logger.warn('LeavePlan[%s] to convert does not exist', leavePlanId);
    throw new NotFoundError({
      name: errors.LEAVE_PLAN_NOT_FOUND,
      message: 'Leave plan does not exist'
    });
  }

  const { leavePackage, intendedStartDate, intendedReturnDate, comment } = leavePlan;
  const leaveTypeId = leavePackage!.leaveTypeId;
  const [employee, validateData, leaveType] = await Promise.all([
    employeeService.getEmployee(leavePlan.employeeId, { includeCompany: true }),
    leaveTypeService.validate({ leaveTypeId, employeeId: leavePlan.employeeId }),
    leaveTypeService.getLeaveTypeById(leaveTypeId)
  ]);
  const { numberOfDaysLeft } = await getEmployeeLeaveTypeSummary(
    leavePlan.employeeId, leaveTypeId
  );
  const numberOfDays = await countWorkingDays({ 
    startDate: intendedStartDate, 
    endDate: intendedReturnDate, 
    considerPublicHolidayAsWorkday: validateData.considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday: validateData.considerWeekendAsWorkday,
    organizationId
  });
  

  if (numberOfDays > numberOfDaysLeft) {
    logger.warn('Number of days requested is more than number of days left for this leave');
    throw new RequirementNotMetError({
      name: errors.LEAVE_QUOTA_EXCEEDED,
      message: `You have ${numberOfDaysLeft} day(s) left for this leave type`
    });

  }

  const createData: leaveRequestRepository.CreateLeaveRequestObject = {
    employeeId: leavePlan.employeeId,
    leavePackageId: leavePlan.leavePackageId,
    startDate: intendedStartDate,
    returnDate: intendedReturnDate,
    comment,
    numberOfDays,
    approvalsRequired: employee.company!.leaveRequestApprovalsRequired
  };

  logger.debug('Converting LeavePlan[%s] to LeaveRequest', leavePlanId);
  const newLeaveRequest = await leaveRequestRepository.convertLeavePlanToRequest(
    { ...createData, leavePlanId },
    { employee: true, leavePackage: { include: { leaveType: true } } }
  );
  logger.info(
    'LeavePlan[%s] converted to LeaveRequest[%s] successfully!', leavePlanId, newLeaveRequest.id
  );

  const approvers = await getEmployeeApproversWithDefaults({
    employeeId: leavePlan.employeeId,
    approvalType: 'leave'
  });
  
  for (const x of approvers) {
    if (x.approver && x.approver.email && x.employee) {
      sendLeaveRequestEmail({
        requestId: newLeaveRequest.id,
        approverEmail: x.approver.email,
        approverFirstName: x.approver.firstName,
        employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
        requestDate: newLeaveRequest.createdAt,
        startDate: newLeaveRequest.startDate,
        endDate: newLeaveRequest.returnDate,
        leaveTypeName: leaveType.name,
        employeePhotoUrl: x.employee.photoUrl,
      });
    }
  }

  // Emit event.LeaveRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newLeaveRequest);
  logger.info(`${events.created} event created successfully!`);

  return newLeaveRequest;
}

export async function uploadLeaveRequests(
  companyId: number, 
  uploadedExcelFile: Express.Multer.File,
  authorizedUser: AuthorizedUser
): Promise<UploadLeaveRequestResponse> {
  const company = await companyRepository.findFirst({ id: companyId });
  const { organizationId } = authorizedUser;

  if (!company) {
    logger.warn('Company[%s] does not exist', companyId);
    throw new NotFoundError({ message: 'Company does not exist' });
  }

  const successful: UploadLeaveRequestResponse['successful'] = [];
  const failed: UploadLeaveRequestResponse['failed'] = [];

  try {
    const collectedRows: UploadLeaveRequestViaSpreadsheetDto[] = [];
    const sheet = await workbook.xlsx.load(uploadedExcelFile.buffer);
    const worksheet = sheet.getWorksheet('leave_requests');
    if (!worksheet) {
      throw new NotFoundError({
        message: 'Work sheet with data not availble'
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let noRows = -1;
    worksheet.eachRow({ includeEmpty: false }, function() {
      noRows += 1;
    });

    worksheet.eachRow(((row: Excel.Row, rowNumber: number) => {
      const handleNull = (index: number) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return row?.values[index] || null;
      };

      if (row.hasValues && Array.isArray(row.values)) {

        if (rowNumber !== 1) {
          const payload: UploadLeaveRequestViaSpreadsheetDto = {
            companyId,
            rowNumber,
            employeeNumber: handleNull(1),
            leaveTypeCode: handleNull(2),
            startDate: handleNull(3),
            returnDate: handleNull(4),
            comment: handleNull(5),
            notifyApprovers: handleNull(6),
          };

          collectedRows.push(payload);
        }
      }
    }));

    for (const collectedRow of collectedRows) {
      const rowNumber = collectedRow.rowNumber;   

      const validation = await handleLeaveRequestSpreadSheetValidation(
        collectedRow, 
        company, 
        organizationId
      );

      if (!validation.issues.length) {
        const checkedRecords = validation.checkedRecords;
        const record = createLeaveRequestPayloadStructure(collectedRow, checkedRecords);
        
        const newLeaveRequest = await leaveRequestRepository.create(record.leaveReqeust);
      
        if (newLeaveRequest) {
          if (validation.checkedRecords.notifyApprovers === true) {
            const approvers = await getEmployeeApproversWithDefaults({
              employeeId: newLeaveRequest.employeeId,
              approvalType: 'leave'
            });
            
            for (const x of approvers) {
              if (x.approver && x.approver.email && x.employee) {
                sendLeaveRequestEmail({
                  requestId: newLeaveRequest.id,
                  approverEmail: x.approver.email,
                  approverFirstName: x.approver.firstName,
                  employeeFullName: `${x.employee.firstName} ${x.employee.lastName}`.trim(),
                  requestDate: newLeaveRequest.createdAt,
                  startDate: newLeaveRequest.startDate,
                  endDate: newLeaveRequest.returnDate,
                  leaveTypeName: checkedRecords.leaveTypeName,
                  employeePhotoUrl: x.employee.photoUrl,
                });
              }
            }
            successful.push({
              leaveRequestId: newLeaveRequest.id,
              rowNumber: collectedRow.rowNumber,
              approversNotified: true
            });
          } else {
            successful.push({
              leaveRequestId: newLeaveRequest.id,
              rowNumber: collectedRow.rowNumber,
              approversNotified: false
            });
          }
        }
      } else {
        failed.push({ rowNumber, errors: validation.issues, });
      }
    }
  } catch (err) {
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return { successful, failed };
}

const handleLeaveRequestSpreadSheetValidation =
  async (
    data: UploadLeaveRequestViaSpreadsheetDto, 
    company: PayrollCompany, 
    organizationId: string
  ) => {
    const response = {
      checkedRecords: {
        leavePackageId: 0,
        employeeId: 0,
        numberOfDays: 0,
        approvalsRequired: 0,
        leaveTypeName: '',
        notifyApprovers: true,
      },
      issues: [] as {
          reason: string,
          column: string,
      }[]
    };

    let  includeHolidays: boolean | undefined,
      includeWeekends: boolean | undefined,
      numberOfDaysLeft: number | undefined,
      approvalsRequired: number | undefined,
      leaveTypeName: string | undefined;

    let employeeId: number;

    const expectedColumns = [
      {
        name: 'employeeNumber', type: 'string', required: true,
        validate: async (data: UploadLeaveRequestViaSpreadsheetDto) => {
          if (!data.employeeNumber) {
            return false;
          }

          const employee: EmployeeDto | null = await employeeRepository.findFirst(
            {
              employeeNumber: data.employeeNumber,
              companyId: company.id
            }
          );

          if (!employee) {
            return {
              error: {
                column: 'employeeNumber',
                reason: 'This employee does not exists'
              },
            };
          } else {
            employeeId = employee.id;
            approvalsRequired = company.leaveRequestApprovalsRequired;

            return { id: employee.id, column: 'employeeId' };
          }
          
        }
      },
      {
        name: 'leaveTypeCode', type: 'string', required: true,
        validate: async (data: UploadLeaveRequestViaSpreadsheetDto) => {
          if (!data.leaveTypeCode)  {
            return {
              error: {
                column: 'code',
                reason: 'Leave type code is required'
              },
            };
          }
          const leaveType = await leaveTypeRepository.findFirst({
            code: data.leaveTypeCode,
          });

          if (!leaveType) {
            return {
              error: {
                column: 'leaveTypeCode',
                reason: 'This leave type does not exists'
              },
            };
          }
          leaveTypeName = leaveType.name;
          let validateData: ValidationReturnObject;
          try {
            validateData = 
            await leaveTypeService.validate({ 
              leaveTypeId: leaveType?.id, 
              employeeId 
            });
          } catch (err) {
            return {
              error: {
                column: 'leaveTypeCode',
                reason: 'No applicable leave package found'
              },
            };
          }

          if (validateData)  {
            const { 
              considerPublicHolidayAsWorkday, 
              considerWeekendAsWorkday, 
              leavePackageId
            } = validateData;
            includeHolidays = considerPublicHolidayAsWorkday 
              ? considerPublicHolidayAsWorkday 
              : false;
            includeWeekends = considerWeekendAsWorkday 
              ? considerWeekendAsWorkday 
              : false;
            const leaveTypeSumary = await getEmployeeLeaveTypeSummary(employeeId, leaveType.id);
            numberOfDaysLeft = leaveTypeSumary.numberOfDaysLeft;
            return { id: leavePackageId, column: 'leavePackageId' };
          } else {
            return {
              error: {
                column: 'leaveTypeCode',
                reason: 'No applicable leave package found'
              },
            };
          }
        }
      },
      {
        name: 'startDate', type: 'date', required: true,
        validate: async (data: UploadLeaveRequestViaSpreadsheetDto) => {
          if (data.startDate) {
            if (!helpers.isValidDate(data.startDate)) {
              return {
                error: {
                  column: 'startDate',
                  reason: 'Date provided is not valid'
                },
              };
            }
          } else {
            return {
              error: {
                column: 'periodStartDate',
                reason: 'Start date is required'
              },
            };
          }

          return false;
        }
      },
      {
        name: 'returnDate', type: 'date', required: false,
        validate: async (data: UploadLeaveRequestViaSpreadsheetDto) => {
          if (data.returnDate) {
            if (!helpers.isValidDate(data.returnDate)) {
              return {
                error: {
                  column: 'returnDate',
                  reason: 'Date provided is not valid'
                },
              };
            }
          }
          const numberOfDays = await countWorkingDays({ 
            startDate: data.startDate, 
            endDate: data.returnDate, 
            considerPublicHolidayAsWorkday: includeHolidays,
            considerWeekendAsWorkday: includeWeekends,
            organizationId
          });
        
          if (numberOfDaysLeft && numberOfDays > numberOfDaysLeft) {
            logger.warn('Number of days requested is more than number of days left for this leave');
            return {
              error: {
                column: 'returnDate',
                reason: 'Number of days requested is more than number of days left for this leave'
              },
            };
        
          } else {
            return { id: numberOfDays, column: 'numberOfDays' };
          }

        }
      },
      {
        name: 'notifyApprovers', type: 'string', required: true,
        validate: async (data: UploadLeaveRequestViaSpreadsheetDto) => {
          const expected = ['no', 'yes'];
          const notifyApprovers = data.notifyApprovers?.toLowerCase();
          if (!expected.includes(notifyApprovers)) {
            return {
              error: {
                column: 'notifyApprovers',
                reason: `Notify approvers has to be one of the following options. ${
                  JSON.stringify(expected)
                }`
              },
            };
          }

          return { id: notifyApprovers === 'yes', column: 'notifyApprovers' };
        }
      }
    ];

    for (const expectedColumn of expectedColumns) {

      const columnName = expectedColumn.name;
      const columnValue = 
        data?.[expectedColumn.name as keyof UploadLeaveRequestViaSpreadsheetDto] || null;

      if (columnValue && expectedColumn.type === 'date') {
        (data as any)[expectedColumn.name as keyof UploadLeaveRequestViaSpreadsheetDto] = 
          new Date(columnValue);
      }

      if (!columnValue && expectedColumn.required) {
        response.issues.push({
          column: columnName,
          reason: `${columnName} is required`,
        });
      }
      if (!['date'].includes(expectedColumn.type)) {
        if (columnValue && typeof columnValue !== expectedColumn.type) {
          response.issues.push({
            column: columnName,
            reason: `Expected ${expectedColumn.type} but got ${typeof columnValue}`
          });
        }
      }

      const executeValidator = await expectedColumn.validate(data);
      if (executeValidator && ('error' in executeValidator) ) {
        response.issues.push(executeValidator.error as any);
      }

      if ( executeValidator && ('id' in executeValidator) 
        && executeValidator?.column) {
        const key = executeValidator.column, value = executeValidator.id;
        response.checkedRecords = { ...response.checkedRecords, [key]: value };
      }
      
      if (approvalsRequired) {
        response.checkedRecords.approvalsRequired = approvalsRequired;
      }
      if (leaveTypeName) {
        response.checkedRecords.leaveTypeName = leaveTypeName;
      }

    }

    
    return response;
  };

const createLeaveRequestPayloadStructure = (
  collectedRow: UploadLeaveRequestViaSpreadsheetDto, 
  checkedRecords: UploadLeaveRequestCheckedRecords
) => {
  const leaveRequestCreatePayload = {
    employeeId: checkedRecords.employeeId,
    leavePackageId: checkedRecords.leavePackageId,
    startDate: collectedRow.startDate,
    returnDate: collectedRow.returnDate,
    comment: collectedRow.comment ? collectedRow.comment : '',
    numberOfDays: checkedRecords.numberOfDays,
    approvalsRequired: checkedRecords.approvalsRequired
  };
  return { leaveReqeust: leaveRequestCreatePayload };
};

export async function exportLeaveRequests(
  companyId: number,
  query: FilterLeaveRequestForExportDto,
  authorizedUser: AuthorizedUser,
) {
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
    'createdAt.gte': createdAtGte,
    'createdAt.lte': createdAtLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authorizedUser, 
    { companyId, queryMode, qEmployeeId },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
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
        },
        createdAt: {
          gte: createdAtGte && new Date(createdAtGte),
          lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
        }
      },
      orderBy: orderByInput,
      include: {
        leavePackage: {
          include: { leaveType: true }
        },
        employee: true,
      }
    });
    logger.info('Found %d LeaveRequest(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying LeaveRequest with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('leave_requests');
  worksheet.columns = [
    { header: 'employeeNumber', key: 'employeeNumber', width: 10 },
    { header: 'leaveTypeCode', key: 'leaveTypeCode', width: 32 }, 
    { header: 'startDate', key: 'startDate', width: 15 },
    { header: 'returnDate', key: 'returnDate', width: 15 },
    { header: 'comment', key: 'comment', width: 32 }, 
    { header: 'notifyApprovers', key: 'notifyApprovers', width: 15 }
  ];

  result.data.forEach((leaveRequest) => {
    worksheet.addRow({
      employeeNumber: leaveRequest.employee?.employeeNumber,
      leaveTypeCode: leaveRequest.leavePackage?.leaveType?.code,
      startDate: leaveRequest.startDate,
      returnDate: leaveRequest.returnDate,
      comment: leaveRequest.comment,
      notifyApprovers: ''
    });
  });
  return workbook;
}

export async function getLeavesTakenReport(
  companyId: number,
  query: QueryLeaveRequestForReportDto,
  authorizedUser: AuthorizedUser
): Promise<LeaveTakenReportObject[]> {
  const {
    'createdAt.gte': createdAtGte,
    'createdAt.lte': createdAtLte,
    'startDate.gte': startDateGte,
    'startDate.lte': startDateLte,
    'returnDate.gte': returnDateGte,
    'returnDate.lte': returnDateLte,
    orderBy
  } = query;
  const orderByInput = helpers.getOrderByInput(orderBy);
  await helpers.applyCompanyScopeToQuery(authorizedUser, { companyId });
  // Get departments in the company and list of all the ids
  logger.info('Getting department and LeaveTypes for company[%s]', companyId);
  const [departments, leaveTypes] = await Promise.all([
    departmentRepository.find({
      where: { companyId }
    }),
    leaveTypeRepository.find({
      where: { 
        leavePackages: {
          some: { companyId }
        },
      },
      include: { leavePackages: true }
    })
  ]);

  // Get all available leaveTypes 
  const report: LeaveTakenReportObject[] = [];
  
  if (leaveTypes.data.length > 0 ) {
    logger.debug('[%s]LeaveTypes retrieved for company[%s]', leaveTypes.data.length, companyId);
    for (const leaveType of leaveTypes.data) {
      logger.info(
        'Finding leavePackages of leaveType[%s] for Company[%s]', 
        leaveType.id, companyId
      );
      let leavePackages: ListWithPagination<LeavePackageDto>;
      try {
        leavePackages = await leavePackageRepository.find({
          where: {
            leaveTypeId: leaveType.id,
            companyId
          },
        });
      } catch (err) {
        logger.warn(
          'Querying LeavePackage for leaveType[%s] by employees in Company[%s] failed',
          leaveType.id, companyId, { error: err as Error }
        );
        throw new ServerError({
          message: (err as Error).message,
          cause: err
        });
      }
      if (leavePackages.data.length > 0) {
        const leavePackageIds: number[] = [];
        leavePackages.data.forEach((pack) => {
          leavePackageIds.push(pack.id);
        });
        const deptSummary: LeaveTakenReportDepartmentObject[] = [];
        // get all list of  employees and find leave requests of leaveType
        for (const dep of departments) {
          let result: ListWithPagination<LeaveRequestDto>;
          try {
            // finding leaveRequests within the leaveType of interest for a company
            logger.debug(
              `Finding LeaveRequest(s) under packages${leavePackageIds.join(', ')}` +
              ` taken by employees in department${dep.id}`
            );
            result = await leaveRequestRepository.find({
              where: { 
                employee: {
                  departmentId: dep.id
                },
                status: LEAVE_REQUEST_STATUS.APPROVED,
                leavePackageId: { in: leavePackageIds },
                createdAt: {
                  gte: createdAtGte && new Date(createdAtGte),
                  lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
                },
                startDate: {
                  gte: startDateGte && new Date(startDateGte),
                  lt: startDateLte && dateutil.getDate(new Date(startDateLte), { days: 1 }),
                }, 
                returnDate: {
                  gte: returnDateGte && new Date(returnDateGte),
                  lt: returnDateLte && dateutil.getDate(new Date(returnDateLte), { days: 1 }),
                },
              },
              orderBy: orderByInput,
              include: {
                employee: { 
                  include: {
                    department: true,
                  } 
                }
              }
            });
            logger.info(
              'Found %d LeaveRequest(s) taken by employees of company[%s]',
              result.data.length, companyId, { query }
            );
          } catch (err) {
            logger.warn(
              'Querying LeaveRequest for leave taken by employees in Company[%s] failed',
              companyId, { error: err as Error }
            );
            throw new ServerError({
              message: (err as Error).message,
              cause: err
            });
          }
          const employeeSummary: LeaveTakenReportEmployeeObject [] = [];
          if (result.data.length > 0) {
            // clear duplicate employeeIds 
            const cleanLeaveRequestList = Object.values(
              result.data.reduce((acc, curr) => {
                if (!acc[curr.employeeId]) {
                  acc[curr.employeeId] = { ...curr, numberOfDays: curr.numberOfDays ?? 0 };
                } else {
                  acc[curr.employeeId].numberOfDays = (
                    acc[curr.employeeId].numberOfDays ?? 0) + (curr.numberOfDays ?? 0
                  );
                }
                return acc;
              }, {} as Record<number, LeaveRequestDto>)
            );
            cleanLeaveRequestList.forEach((req) => {
              employeeSummary.push({
                id: req.employee!.id,
                employeeNumber: req.employee!.employeeNumber,
                name: `${req.employee!.lastName} ${req.employee!.firstName}`,
                numberOfDays: req.numberOfDays ?? 0
              });
            });
          }
          if (employeeSummary.length > 0) {
            let numberOfDaysPerDepartment = 0;
            employeeSummary.forEach((empSumm) => numberOfDaysPerDepartment += empSumm.numberOfDays);

            deptSummary.push({
              id: dep.id,
              code: dep.code,
              name: dep.name,
              employees: employeeSummary,
              numberOfDaysPerDepartment
            });
          }
        }
        // get leaveRequests for employees without department if any
        let noDepartmentResult: ListWithPagination<LeaveRequestDto>;
        try {
          // finding leaveRequests within the leaveType of interest for a company
          logger.debug(
            `Finding LeaveRequest(s) under packages${leavePackageIds.join(', ')}` +
            'taken by employees without department if any'
          );
          noDepartmentResult = await leaveRequestRepository.find({
            where: { 
              employee: {
                departmentId: null
              },
              status: LEAVE_REQUEST_STATUS.APPROVED,
              leavePackageId: { in: leavePackageIds },
              createdAt: {
                gte: createdAtGte && new Date(createdAtGte),
                lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
              },
              startDate: {
                gte: startDateGte && new Date(startDateGte),
                lt: startDateLte && dateutil.getDate(new Date(startDateLte), { days: 1 }),
              }, 
              returnDate: {
                gte: returnDateGte && new Date(returnDateGte),
                lt: returnDateLte && dateutil.getDate(new Date(returnDateLte), { days: 1 }),
              },
            },
            orderBy: orderByInput,
            include: {
              employee: { 
                include: {
                  department: true,
                } 
              }
            }
          });
          logger.info(
            'Found %d LeaveRequest(s) taken by employees of company[%s]',
            noDepartmentResult.data.length, companyId, { query }
          );
        } catch (err) {
          logger.warn(
            'Querying LeaveRequest for leave taken by employees in Company[%s] failed',
            companyId, { error: err as Error }
          );
          throw new ServerError({
            message: (err as Error).message,
            cause: err
          });
        }
        const employeeNoDepartmentSummary: LeaveTakenReportEmployeeObject [] = [];
        if (noDepartmentResult.data.length > 0) {
          // clear duplicate employeeIds 
          const cleanLeaveRequestList = Object.values(
            noDepartmentResult.data.reduce((acc, curr) => {
              if (!acc[curr.employeeId]) {
                acc[curr.employeeId] = { ...curr, numberOfDays: curr.numberOfDays ?? 0 };
              } else {
                acc[curr.employeeId].numberOfDays = (
                  acc[curr.employeeId].numberOfDays ?? 0) + (curr.numberOfDays ?? 0
                );
              }
              return acc;
            }, {} as Record<number, LeaveRequestDto>)
          );
          cleanLeaveRequestList.forEach((req) => {
            employeeNoDepartmentSummary.push({
              id: req.employee!.id,
              employeeNumber: req.employee!.employeeNumber,
              name: `${req.employee!.lastName} ${req.employee!.firstName}`,
              numberOfDays: req.numberOfDays ?? 0
            });
          });
        }
        if (employeeNoDepartmentSummary.length > 0) {
          let numberOfDaysPerDepartment = 0;
          employeeNoDepartmentSummary.forEach(
            (empSumm) => numberOfDaysPerDepartment += empSumm.numberOfDays
          );

          deptSummary.push({
            code: 'NODEPARTMENT',
            name: 'No Department',
            employees: employeeNoDepartmentSummary,
            numberOfDaysPerDepartment
          });
        }
        if (deptSummary.length > 0) {
          let numberOfDaysPerCompany = 0;
          deptSummary.forEach((x) => numberOfDaysPerCompany += x.numberOfDaysPerDepartment);

          report.push({
            leaveType: {
              id: leaveType.id,
              code: leaveType.code,
              name: leaveType.name
            },
            department: deptSummary,
            numberOfDaysPerCompany
          });
        }
      }
    }
  }
  return report;
}

export async function getEmployeeLeavesTakenReport(
  companyId: number,
  employeeId: number,
  query: QueryLeaveRequestForReportDto,
  authorizedUser: AuthorizedUser
): Promise<EmployeeLeaveTakenReportObject> {
  const { organizationId } = authorizedUser;
  // Validate emloyee and company
  const [company, employee] = await Promise.all([
    companyService.validatePayrollCompany(companyId),
    employeeService.getEmployee(employeeId, { includeMajorGradeLevel: true }),
  ]);

  logger.info('Employee[%s] and Company[%s] exists', employee.id, company.id);

  const {
    'createdAt.gte': createdAtGte,
    'createdAt.lte': createdAtLte,
    'startDate.gte': startDateGte,
    'startDate.lte': startDateLte,
    'returnDate.gte': returnDateGte,
    'returnDate.lte': returnDateLte,
    orderBy
  } = query;
  const orderByInput = helpers.getOrderByInput(orderBy);
  await helpers.applyCompanyScopeToQuery(authorizedUser, { companyId });  

  // Get all available leaveTypes 
  const leaveTypes = await leaveTypeRepository.find({
    where: { 
      leavePackages: {
        some: { companyId }
      },
    },
    include: { leavePackages: true }
  });
  const reportSummary: LeaveTakenWithPackageReportObject[]= [];

  if (leaveTypes.data.length > 0 ) {  
    for (const leaveType of leaveTypes.data) {
      // get necessary details to calculate number of days
      let validateData;
      try {
        validateData = await leaveTypeService.validate({ 
          leaveTypeId: leaveType.id, employeeId 
        });
      } catch (err) {
        logger.warn(
          'Validating LeaveType[%s] failed',
          leaveType.id, { error: (err as Error).stack }
        );
      }
      // Get employees leavePackages using employee companyLevel from majorGradeLevel
      if (employee?.majorGradeLevel?.companyLevelId && validateData) {
        const { considerPublicHolidayAsWorkday, considerWeekendAsWorkday } = validateData;
        const companyLevelId = employee?.majorGradeLevel?.companyLevelId;
        // Get leavePackages for employe level and of leaveType
        const leavePackages = await leavePackageRepository.find({
          where: {
            companyLevelLeavePackages: { some: { 
              leavePackage: { leaveTypeId: leaveType.id },
              companyLevelId 
            } }
          },
          include: { leaveType: true }
        });
        let packageSummary: EmployeeLeavePackageObject[] = [];
        if (leavePackages.data.length > 0) {
          const leavePackagesList = leavePackages.data;
          const leavePackageReport: EmployeeLeavePackageObject[] = [];
          for (const pack of leavePackagesList) {
            let daysAvailable = 0;
            let daysUsed = 0;
            let daysApprovedButNotUsed = 0;
            let daysPendingApproval = 0;
            
            let result: ListWithPagination<LeaveRequestDto>;
            try {
              // finding leaveRequests for leavePackage under leaveType of interest for an employee
              logger.debug('Finding LeaveRequest(s) taken by employees in company[%s]', companyId);
              result = await leaveRequestRepository.find({
                where: { 
                  employeeId,
                  leavePackageId: pack.id,
                  createdAt: {
                    gte: createdAtGte && new Date(createdAtGte),
                    lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
                  },
                  startDate: {
                    gte: startDateGte && new Date(startDateGte),
                    lt: startDateLte && dateutil.getDate(new Date(startDateLte), { days: 1 }),
                  }, 
                  returnDate: {
                    gte: returnDateGte && new Date(returnDateGte),
                    lt: returnDateLte && dateutil.getDate(new Date(returnDateLte), { days: 1 }),
                  },
                },
                orderBy: orderByInput,
                include: {
                  employee: { 
                    include: {
                      department: true,
                    } 
                  }
                }
              });
              logger.info(
                'Found %d LeaveRequest(s) taken by employees of company[%s]',
                result.data.length, companyId, { query }
              );
            } catch (err) {
              logger.warn(
                'Querying LeaveRequest for leave taken by employees in Company[%s] failed',
                companyId, { error: err as Error }
              );
              throw new ServerError({
                message: (err as Error).message,
                cause: err
              });
            }
            if (result.data.length > 0) {
              // get individual leave requests for employee for package and calculate 
              // the number of days based on the status
              for (const req of result.data) {
                const today = new Date();
                if (req.status === LEAVE_REQUEST_STATUS.APPROVED) {
                  const nextDay = new Date(today);
                  nextDay.setHours(0, 0, 0, 0);
                  nextDay.setDate(today.getDate() + 1);
                  if (req.returnDate > today && req.startDate <= today) {
                    const daysLeft = await countWorkingDays({ 
                      startDate: nextDay, 
                      endDate: req.returnDate, 
                      considerPublicHolidayAsWorkday,
                      considerWeekendAsWorkday,
                      organizationId
                    });
                    const daysElapsed = req.numberOfDays! - daysLeft;
                    daysUsed += daysElapsed;
                  } else if (req.returnDate <= today) {
                    daysUsed = daysUsed + req.numberOfDays!;
                  } else if (req.startDate > today) {
                    daysApprovedButNotUsed = daysApprovedButNotUsed + req.numberOfDays!;
                  }
                } else if (
                  req.status === LEAVE_REQUEST_STATUS.PENDING && 
                  req.startDate > today
                ) {
                  daysPendingApproval = daysPendingApproval + req.numberOfDays!;
                }
                daysAvailable = pack.maxDays! - daysUsed;
              }
              leavePackageReport.push({
                id: pack.id,
                name: pack.name,
                code: pack.code,
                daysUsed,
                daysApprovedButNotUsed,
                daysPendingApproval,
                daysAvailable,
              });
            }
          }
          packageSummary = leavePackageReport;
        }
        if (packageSummary.length > 0) {
          reportSummary.push(
            {
              id: leaveType.id,
              code: leaveType.code,
              name: leaveType.name,
              leavePackages: packageSummary
            }
          );
        } 
      }
        
    }
  }
  return  {
    leaveType: reportSummary,
    employee: {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      name: `${employee.lastName}, ${employee.firstName}`
    }
  };
}

export async function getLeavesBalanceReport(
  companyId: number,
  authorizedUser: AuthorizedUser
): Promise<LeaveBalanceReportObject[]> {
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authorizedUser, { companyId });
  const employees = await employeeRepository.find({
    where: scopedQuery,
    include: { majorGradeLevel: { include: { companyLevel: true } } }
  });  

  // Get all available leaveTypes 
  const leaveTypes = await leaveTypeRepository.find({
    where: { 
      leavePackages: {
        some: { companyId }
      },
    },
    include: { leavePackages: true }
  });
  const report: LeaveBalanceReportObject[] = [];
  
  // for each employee, we get leavePackages available for them and remaining days 
  if (employees.data.length > 0) {
    for (const employee of employees.data) {
      const leaveTypeSummary: LeaveBalanceReportLeaveTypeObject[] = [];
      if (leaveTypes.data.length > 0 && employee.majorGradeLevel?.companyLevelId) {
        for (const leaveType of leaveTypes.data) {
          const leavePackageSummary: LeaveBalanceReportLeavePackageObject[] = [];
          // get Leave packages available for employee for specific leave type
          const leavePackages = await leavePackageRepository.find({
            where: {
              companyLevelLeavePackages: { some: { 
                leavePackage: { leaveTypeId: leaveType.id },
                companyLevelId: employee.majorGradeLevel.companyLevelId
              } }
            },
            include: { leaveType: true }
          }); 
          if (leavePackages.data.length > 0) {
            for (const leavePackage of leavePackages.data) {
              let remainingLeaveDays = leavePackage.maxDays;
              // get all list of  employees and find leave requests of leaveType
              let result: ListWithPagination<LeaveRequestDto>;
              try {
                // finding leaveRequests within the leaveType of interest for a company
                logger.debug(
                  'Finding LeaveRequest(s) taken by employees in company[%s]', companyId
                );
                result = await leaveRequestRepository.find({
                  where: { 
                    employeeId: employee.id,
                    status: LEAVE_REQUEST_STATUS.APPROVED,
                    leavePackageId: leavePackage.id,
                  },
                });
                logger.info(
                  'Found %d LeaveRequest(s) taken by employees of company[%s]',
                  result.data.length, companyId
                );
              } catch (err) {
                logger.warn(
                  'Querying LeaveRequest for leave taken by employees in Company[%s] failed',
                  companyId, { error: err as Error }
                );
                throw new ServerError({
                  message: (err as Error).message,
                  cause: err
                });
              }
              let usedDays = 0;
              if (result.data.length > 0) {
                // clear duplicate employeeIds 
                result.data.forEach((req) => {
                  usedDays = usedDays + req.numberOfDays!;
                });
              }
              remainingLeaveDays = remainingLeaveDays - usedDays;
              leavePackageSummary.push({
                id: leavePackage.id,
                code: leavePackage.code,
                name: leavePackage.name,
                remainingLeaveDays
              });
            }
          }
          if (leavePackageSummary.length > 0) {
            leaveTypeSummary.push({
              id: leaveType.id,
              name: leaveType.name,
              code: leaveType.code,
              leavePackages: leavePackageSummary
            });
          }
        }
      }
      if (leaveTypeSummary.length > 0) {
        report.push({
          employee: {
            id: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.lastName}, ${employee.firstName}`,
          },
          leaveTypes: leaveTypeSummary
        });
      }
    }
  }
  return report;
}