import { 
  CompanyCurrency,
  REIMBURESEMENT_REQUEST_STATUS, 
  ReimbursementRequest 
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { RequestQueryMode } from '../domain/dto/leave-request.dto';
import { 
  CompleteReimbursementRequestDto,
  CreateReimbursementRequestDto, 
  QueryReimbursementRequestDto, 
  ReimbursementResponseAction, 
  ReimbursementRequestDto, 
  ReimbursementRequestUpdatesDto, 
  ReimbursementResponseInputDto, 
  UpdateReimbursementRequestDto,
  SearchReimbursementRequestDto
} from '../domain/dto/reimbursement-request.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { 
  FailedDependencyError, 
  HttpError, 
  InvalidStateError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import * as repository from '../repositories/reimbursement-request.repository';
import { ListWithPagination } from '../repositories/types';
import * as currencyService from '../services/company-currency.service';
import * as employeeService from '../services/employee.service';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { EmployeeDto } from '../repositories/employee.repository';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'ReimbursementRequestService' });
const events = {
  created: 'event.ReimbursementRequest.created',
  modified: 'event.ReimbursementRequest.modified',
  deleted: 'event.ReimbursementRequest.deleted',
} as const;

export async function addReimbursementRequest(
  payload: CreateReimbursementRequestDto,
): Promise<ReimbursementRequest> {
  const { employeeId, currencyId } = payload;
  
  logger.debug(
    'Validating Employee[%s], parent & CompanyCurrency[%s]',
    employeeId, currencyId
  );
  let _employee: EmployeeDto, _currency: CompanyCurrency;
  try {
    [_employee, _currency] = await Promise.all([
      employeeService.getEmployee(employeeId, { includeCompany: true }),
      currencyService.getCompanyCurrency(currencyId)
    ]);
  } catch (err) {
    logger.warn(
      'Validating Employee[%s], parent or CompanyCurrency[%s] failed', 
      employeeId, currencyId,
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info(
    'Employee[%s], parent & CompanyCurrency[%s] validated',
    employeeId, currencyId
  );
 
  logger.debug('Adding new ReimbursementRequest to the database...');
  let newReimbursementRequest: ReimbursementRequest;
  try {
    newReimbursementRequest = await repository.create({
      ...payload,
      approvalsRequired: _employee.company!.leaveRequestApprovalsRequired
    });
    logger.info(
      'ReimbursementRequest[%s] added successfully!',
      newReimbursementRequest.id
    );
  } catch (err) {
    logger.error('Adding ReimbursementRequest failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.ReimbursementRequest.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newReimbursementRequest);
  logger.info(`${events.created} event created successfully!`);

  return newReimbursementRequest;
}

export async function getReimbursementRequests(
  query: QueryReimbursementRequestDto,
  authorizedUser: AuthorizedUser,
): Promise<ListWithPagination<ReimbursementRequestDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId: qEmployeeId,
    status,
    'expenditureDate.gte': expenditureDateGte,
    'expenditureDate.lte': expenditureDateLte,
    approverId,
    completerId,
    queryMode,
    'createdAt.gte': createdAtGte,
    'createdAt.lte': createdAtLte,
    'approvedAt.gte': approvedAtGte,
    'approvedAt.lte': approvedAtLte,
    'completedAt.gte': completedAtGte,
    'completedAt.lte': completedAtLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  // const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
  //   authorizedUser, { employeeId: qEmployeeId, queryMode }
  // );

  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authorizedUser, { employeeId: qEmployeeId, queryMode }
  );
    
  let result: ListWithPagination<ReimbursementRequestDto>;
  try {
    logger.debug('Finding ReimbursementRequest(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery,
        completerId,
        approverId, 
        status, 
        createdAt: {
          gte: createdAtGte && new Date(createdAtGte),
          lt: createdAtLte && dateutil.getDate(new Date(createdAtLte), { days: 1 }),
        }, 
        expenditureDate: {
          gte: expenditureDateGte && new Date(expenditureDateGte),
          lt: expenditureDateLte && dateutil.getDate(new Date(expenditureDateLte), { days: 1 }),
        },
        approvedAt: {
          gte: approvedAtGte && new Date(approvedAtGte),
          lt: approvedAtLte && dateutil.getDate(new Date(approvedAtLte), { days: 1 }),
        },
        completedAt: {
          gte: completedAtGte && new Date(completedAtGte),
          lt: completedAtLte && dateutil.getDate(new Date(completedAtLte), { days: 1 }),
        }
      },
      orderBy: orderByInput,
      include: { 
        employee: true, 
        completer: true, 
        approver: true, 
        currency: { include: { currency: true } } }
    });
    logger.info(
      'Found %d ReimbursementRequest(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying ReimbursementRequest with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function getReimbursementRequest(
  id: number,
  authorizedUser: AuthorizedUser
): Promise<ReimbursementRequestDto> {
  // const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
  //   authorizedUser, { id, queryMode: RequestQueryMode.ALL }
  // );

  const { scopedQuery } = await helpers.applyApprovalScopeToQuery(
    authorizedUser, { id, queryMode: RequestQueryMode.ALL }
  );

  logger.debug('Getting details for ReimbursementRequest[%s]', id);
  let reimbursementRequest: ReimbursementRequestDto | null;
  try {
    reimbursementRequest = await repository.findFirst(
      scopedQuery,
      { 
        employee: true, 
        completer: true, 
        approver: true, 
        currency: { include: { currency: true } }, 
        requestAttachments: { include: { uploader: true } },
        requestComments: { include: { commenter: true } }
      }
    );
  } catch (err) {
    logger.warn('Getting ReimbursementRequest[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request not found'
    });
  }  
  
  logger.info('ReimbursementRequest[%s] details retrieved!', id);
  return reimbursementRequest;
}

export async function updateReimbursementRequest(
  id: number, 
  updateData: UpdateReimbursementRequestDto
): Promise<ReimbursementRequestDto> {
  const { currencyId } = updateData;

  const reimbursementRequest = await repository.findOne({ id });
  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request to update does not exisit'
    });
  }

  if (currencyId) {
    try {
      await currencyService.getCompanyCurrency(currencyId);
    } catch (err) {
      logger.warn('Getting CompanyCurrency[%s] fialed', currencyId);
      if (err instanceof HttpError) throw err;
      throw new FailedDependencyError({
        message: 'Dependency check failed',
        cause: err
      });
    }
    logger.info('CompanyCurrency[%s] exists', currencyId);
  }

  logger.debug('Persisting update(s) to ReimbursementRequest[%s]', id);
  const updatedReimbursementRequest = await repository.update({
    where: { id }, 
    data: updateData, 
    include: { 
      requestAttachments: { include: { uploader: true } },
      requestComments: { include: { commenter: true } } 
    }
  });
  logger.info('Update(s) to ReimbursementRequest[%s] persisted successfully!', id);

  // Emit event.ReimbursementRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedReimbursementRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedReimbursementRequest;
}

export async function addResponse(
  id: number, 
  responseData: ReimbursementResponseInputDto,
  authUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authUser;
  const { action } = responseData;
  let approvingEmployeeId: number;
  if (employeeId) {
    approvingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding ReimbursementRequest[%s] to respond to', id);
  const reimbursementRequest = await repository.findOne({ id });
  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] to add response to does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request to add response to does not exist'
    });
  } else if (
    reimbursementRequest.status === REIMBURESEMENT_REQUEST_STATUS.QUERIED || 
    reimbursementRequest.status === REIMBURESEMENT_REQUEST_STATUS.SUBMITTED
  ) {
    logger.info('ReimbursementRequest[%s] exists and can be responded to', id);
    let expectedLevel: number | undefined;
    if (action === ReimbursementResponseAction.APPROVE 
      || action === ReimbursementResponseAction.REJECT) {
      const lastComment = await repository.findLastComment({ requestId: id });
      const lastLevel = lastComment ? lastComment.approverLevel : 0;
      expectedLevel = lastLevel + 1;
    }
    await helpers.validateResponder({
      authUser, 
      requestorEmployeeId: reimbursementRequest.employeeId,
      expectedLevel: expectedLevel ? expectedLevel : undefined
    });

  
    logger.debug('Adding response to ReimbursementRequest[%s]', id);
    const updatedReimbursementRequest = await repository.respond({
      id,
      data: { 
        ...responseData, 
        approvingEmployeeId, 
        finalApproval: reimbursementRequest.approvalsRequired === expectedLevel, 
        approverLevel: expectedLevel,
      },
      include: { 
        employee: true, 
        completer: true, 
        approver: true, 
        currency: { include: { currency: true } }, 
        requestAttachments: { include: { uploader: true } },
        requestComments: { include: { commenter: true } }
      }
    });
    logger.info('Response added to ReimbursementRequest[%s] successfully!', id);

    // Emit event.ReimbursementRequest.modified event
    logger.debug(`Emitting ${events.modified}`);
    kafkaService.send(events.modified, updatedReimbursementRequest);
    logger.info(`${events.modified} event emitted successfully!`);

    return updatedReimbursementRequest;
  } else {
    logger.warn(
      'ReimbursementRequest[%s] cannot be responded to due to current status[%s]',
      id, reimbursementRequest.status
    );
    throw new InvalidStateError({
      message: 'Response not allowed for this reimbursement request'
    });
  }
}

export async function postUpdate(
  id: number, 
  responseData: ReimbursementRequestUpdatesDto,
  authUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authUser;
  let updatingEmployeeId: number;
  if (employeeId) {
    updatingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding ReimbursementRequest[%s] to post update to', id);
  const reimbursementRequest = await repository.findOne({ id });
  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] to post update to does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request to post update to does not exist'
    });
  } else if (reimbursementRequest.status !== REIMBURESEMENT_REQUEST_STATUS.QUERIED){
    logger.warn(
      'ReimbursementRequest[%s] cannot be updated due to current status[%s]',
      id, reimbursementRequest.status
    );
    throw new InvalidStateError({
      message: 'Update not allowed for this reimbursement request'
    });
  }
  logger.info('ReimbursementRequest[%s] exists and update can be posted on', id);

  if (updatingEmployeeId !== reimbursementRequest.employeeId) {
    logger.debug('Validating if Employee[%s] can post update to this request', updatingEmployeeId);
    await helpers.validateResponder({
      authUser, 
      requestorEmployeeId: reimbursementRequest.employeeId
    });
    logger.info('Employee[%s] can post update to this request', updatingEmployeeId);
  }
  
  logger.debug('Adding response to ReimbursementRequest[%s]', id);
  const updatedReimbursementRequest = await repository.postUpdate({
    id,
    data: { ...responseData, updatingEmployeeId },
    include: { 
      employee: true, 
      completer: true, 
      approver: true, 
      currency: { include: { currency: true } }, 
      requestAttachments: { include: { uploader: true } },
      requestComments: { include: { commenter: true } }
    }
  });
  logger.info('Response added to ReimbursementRequest[%s] successfully!', id);

  // Emit event.ReimbursementRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedReimbursementRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedReimbursementRequest!;
}

export async function completeRequest(
  id: number, 
  responseData: CompleteReimbursementRequestDto,
  authUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authUser;
  let completingEmployeeId: number;
  if (employeeId) {
    completingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }

  logger.debug('Finding ReimbursementRequest[%s] to complete', id);
  const reimbursementRequest = await repository.findOne({ id });
  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] to complete does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request to complete does not exist'
    });
  }
  logger.info('ReimbursementRequest[%s] exists and can be completed', id);

  if (reimbursementRequest.status !== REIMBURESEMENT_REQUEST_STATUS.APPROVED){
    logger.warn(
      'ReimbursementRequest[%s] cannot be completed to due to current status[%s]',
      id, reimbursementRequest.status
    );
    throw new InvalidStateError({
      message: 'Can not complete this reimbursement request'
    });
  }

  logger.debug('Validating if Employee[%s] can complete this request', completingEmployeeId);
  await helpers.validateResponder({
    authUser, 
    requestorEmployeeId: reimbursementRequest.employeeId
  });
  logger.info('Employee[%s] can complete this request', completingEmployeeId);

  logger.debug('Completing ReimbursementRequest[%s]', id);
  const updatedReimbursementRequest = await repository.completeRequest({
    id,
    data: { ...responseData, completingEmployeeId },
    include: { 
      employee: true, 
      completer: true, 
      approver: true, 
      currency: { include: { currency: true } }, 
      requestAttachments: { include: { uploader: true } },
      requestComments: { include: { commenter: true } }
    }
  });
  logger.info('ReimbursementRequest[%s] completed successfully!', id);

  // Emit event.ReimbursementRequest.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedReimbursementRequest);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedReimbursementRequest;
}

export async function searchReimbursementRequests(
  query: SearchReimbursementRequestDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<ReimbursementRequestDto>> {
  const {
    q: searchParam,
    queryMode,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    authUser, { queryMode }
  );

  let result: ListWithPagination<ReimbursementRequestDto>;
  try {
    logger.debug('Finding ReimbursementRequest(s) that matched search query', { query });
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        ...scopedQuery,
        title: {
          search: searchParam,
        },
        description: {
          search: searchParam,
        },
      },
      include: { 
        employee: true, 
        completer: true, 
        approver: true, 
        currency: { include: { currency: true } } 
      }
    });
    logger.info('Found %d ReimbursementRequest(s) that matched query', { query });
  } catch (err) {
    logger.warn(
      'Searching ReimbursementRequest with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function deleteReimbursementRequest(
  id: number, 
  authUser: AuthorizedUser
): Promise<void> {
  const { employeeId } = authUser;
  let deletingEmployeeId: number;
  if (employeeId) {
    deletingEmployeeId = employeeId;
  } else {
    throw new UnauthorizedError({});
  }
  logger.debug('Finding ReimbursementRequest[%s] to delete', id);
  const reimbursementRequest = await repository.findOne({ id });
  if (!reimbursementRequest) {
    logger.warn('ReimbursementRequest[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
      message: 'Reimbursement request to delete does not exist'
    });
  } else if (reimbursementRequest.status !== REIMBURESEMENT_REQUEST_STATUS.SUBMITTED) {
    logger.warn(
      'ReimbursementRequest[%s] cannot be deleted due to current status[%s]',
      id, reimbursementRequest.status
    );
    throw new InvalidStateError({
      message: 'Reimbursement request can not be deleted due to its status'
    });
  }

  if (deletingEmployeeId !== reimbursementRequest.employeeId) {
    logger.debug('Validating if Employee[%s] can delete this request', deletingEmployeeId);
    await helpers.validateResponder({
      authUser, 
      requestorEmployeeId: reimbursementRequest.employeeId
    });
    logger.info('Employee[%s] can deletd this request', deletingEmployeeId);
  }

  let deletedReimbursementRequest: ReimbursementRequest;
  logger.debug('Deleting ReimbursementRequest[%s] from database...', id);
  try {
    deletedReimbursementRequest = await repository.deleteOne({ id });
    logger.info('ReimbursementRequest[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting ReimbursementRequest[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.ReimbursementRequest.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, deletedReimbursementRequest);
  logger.info(`${events.deleted} event emitted successfully!`);
}