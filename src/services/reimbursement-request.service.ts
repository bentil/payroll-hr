import { REIMBURESEMENT_REQUEST_STATUS, ReimbursementRequest } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CompleteReimbursementRequestDto,
  CreateReimbursementRequestDto, 
  QueryReimbursementRequestDto, 
  ReimbursementResponseAction, 
  ReimbursementRequestDto, 
  ReimbursementRequestUpdatesDto, 
  ReimbursementResponseInputDto, 
  UpdateReimbursementRequestDto
} from '../domain/dto/reimbursement-request.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import * as repository from '../repositories/reimbursement-request.repository';
import { 
  FailedDependencyError, 
  HttpError, 
  InvalidStateError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import * as employeeService from '../services/employee.service';
import * as currencyService from '../services/company-currency.service';
import { getParentEmployee } from './company-tree-node.service';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'ReimbursementRequest' });

const events = {
  created: 'event.ReimbursementRequest.created',
  modified: 'event.ReimbursementRequest.modified',
};

export async function addReimbursementRequest(
  payload: CreateReimbursementRequestDto,
): Promise<ReimbursementRequest> {
  const { employeeId, currencyId } = payload;
  // add to promise
  let parent, employee, currency;
  // VALIDATION
  try {
    [parent, employee, currency] = await Promise.all([
      getParentEmployee(employeeId),
      employeeService.getEmployee(employeeId),
      currencyService.getCompanyCurrency(currencyId)
    ]);
  } catch (err) {
    logger.warn('Validating Employee[%s] and/or Currency[%s] and/or Parent[%s] failed', 
      employeeId, currencyId, parent?.id,
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info(
    'Employee[%s], Currency[%s] and Parent[%s] exists', employee.id, currency.id, parent?.id
  );
 
  logger.debug('Adding new ReimbursementRequest to the database...');

  let newReimbursementRequest: ReimbursementRequest;
  try {
    newReimbursementRequest = await repository.create(payload);
    logger.info('ReimbursementRequest[%s] added successfully!', newReimbursementRequest.id);
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
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
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
): Promise<ReimbursementRequestDto> {

  logger.debug('Getting details for ReimbursementRequest[%s]', id);
  let reimbursementRequest: ReimbursementRequestDto | null;
  try {
    reimbursementRequest = await repository.findOne(
      { id },
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
      message: 'Reimbursement request does not exist'
    });
  }  
  
  logger.info('ReimbursementRequest[%s] details retrieved!', id);
  return reimbursementRequest;
}

export async function updateReimbursementRequest(
  id: number, 
  updateData: UpdateReimbursementRequestDto
): Promise<ReimbursementRequest> {
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
    where: { id }, data: updateData
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
  authorizedUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authorizedUser;
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

    await helpers.validateResponder(authorizedUser, reimbursementRequest.employeeId);

  
    logger.debug('Adding response to ReimbursementRequest[%s]', id);
    const updatedReimbursementRequest = await repository.respond({
      id,
      data: { ...responseData, approvingEmployeeId, 
        approvedAt: action === ReimbursementResponseAction.APPROVE ? new Date() : undefined
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
  authorizedUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authorizedUser;
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
  authorizedUser: AuthorizedUser,
): Promise<ReimbursementRequestDto> {
  const { employeeId } = authorizedUser;
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