import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  GetOneEmployeeApproverDto,
  QueryEmployeeApproverDto,
  UpdateEmployeeApproverDto
} from '../domain/dto/employee-approver.dto';
import {
  HttpError,
  NotFoundError,
  RequirementNotMetError,
  ServerError
} from '../errors/http-errors';
// eslint-disable-next-line max-len
import * as repository from '../repositories/employee-approver.repository';
import * as employeeService from './employee.service';
import { ListWithPagination } from '../repositories/types';
import { rootLogger } from '../utils/logger';
import * as helpers from '../utils/helpers';
import { KafkaService } from '../components/kafka.component';
import { AuthorizedUser } from '../domain/user.domain';
import { EmployeeApprover } from '@prisma/client';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeApproverService' });

const events = {
  created: 'event.EmployeeApprover.created',
  modified: 'event.EmployeeApprover.modified',
  deleted: 'event.EmployeeApprover.deleted'
};

export async function createEmployeeApprover(
  createData: CreateEmployeeApproverDto,
  employeeId: number,
  authUser: AuthorizedUser
): Promise<EmployeeApproverDto> {
  const { approverId } = createData;
  //Validation
  const [employee, approver] = await Promise.all([
    employeeService.validateEmployee(employeeId, authUser, { throwOnNotActive: true }),
    employeeService.validateEmployee(approverId, authUser, { throwOnNotActive: true })
  ]);
  logger.info('Employee[%s] and Approver[%s] validated successfully', employeeId, approverId);
  if (employee.companyId !== approver.companyId) {
    throw new RequirementNotMetError({
      message: 'Approver and employee are not of same company'
    });
  }

  logger.debug('Persisting new EmployeeApprover...');
  let employeeApprover: EmployeeApproverDto;
  try {
    employeeApprover = await repository.create({
      ...createData,
      employeeId
    });
    logger.info('EmployeeApprover[%s] persisted successfully!', employeeApprover.id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting EmployeeApprover failed', { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeApprover.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, employeeApprover);
  logger.info(`${events.created} event created successfully!`);

  return employeeApprover;
}

export async function updateEmployeeApprover(
  id: number,
  employeeId: number,
  updateData: UpdateEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<EmployeeApproverDto> {
  const { approverId } = updateData;
  logger.info('Getting EmployeeApprover[%s] to update', id);
  let employeeApprover: EmployeeApproverDto | null;
  try {
    employeeApprover = await repository.findOne({ id, employeeId });
  } catch (err) {
    logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  
  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] to update does not exist', id);
    throw new NotFoundError({ 
      message: 'Employee approver to update does not exist' 
    });
  }

  // validating
  if (approverId) {
    await employeeService.validateEmployee(approverId, authUser);
  }

  const updatedEmployeeApprover = await repository.update({
    where: { id, employeeId },
    data: updateData
  });

  logger.info('Update(s) to EmployeeApprover[%s] persisted successfully!', id);

  // Emit event.EmployeeApprover.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeApprover);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeApprover;
}

export async function getEmployeeApprovers(
  employeeId: number,
  query: QueryEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<EmployeeApproverDto>> {
  const {
    page,
    limit: take,
    orderBy,
    approverId: queryApprover,
    level,
    inverse,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  let approverId: number | undefined, scopeQuery;
  if (inverse) {
    approverId = employeeId;
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { }
    );
    scopeQuery = scopedQuery;
  } else {
    approverId = queryApprover;
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { employeeId }
    );
    scopeQuery = scopedQuery;
  }

  let result: ListWithPagination<EmployeeApproverDto>;
  logger.debug('Finding EmployeeApprover(s) that match query', { query });
  try {
    result = await repository.find({
      skip,
      take,
      where: {
        ...scopeQuery,
        approverId,
        level
      },
      orderBy: orderByInput,
      include: {
        employee: true,
        approver: true
      }
    });
    logger.info(
      'Found %d EmployeeApprover(s) that matched query',
      result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeApprover with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return result;
}


export async function getEmployeeApproverId(
  id: number,
  employeeId: number,
  query: GetOneEmployeeApproverDto,
): Promise<EmployeeApproverDto> {
  logger.debug('Getting details for EmployeeApprover[%s]', id);
  let approverId: number, employeeApprover: EmployeeApproverDto | null;
  if (query?.inverse) {
    approverId = employeeId;
    try {
      employeeApprover = await repository.findOne(
        { id, approverId },
        { employee: true, approver: true }
      );
    } catch (err) {
      logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    
  } else {
    try {
      employeeApprover = await repository.findOne(
        { id, employeeId },
        { employee: true, approver: true }
      );
    } catch (err) {
      logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    
  }  

  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] does not exist', id);
    throw new NotFoundError({ message: 'Employee approver does not exist' });
  }
  logger.info('EmployeeApprover[%s] details retrieved!', id);
  return employeeApprover;
}

export async function deleteEmployeeApprover(
  id: number,
  employeeId: number
): Promise<EmployeeApprover> {
  logger.debug('Getting details for EmployeeApprover[%s]', id);
  let deletedEmployeeApprover: EmployeeApprover | null, employeeApprover: EmployeeApprover | null;
  try {
    employeeApprover = await repository.findOne({ id, employeeId });
    logger.info('EmployeeApprover[%s] details retrieved!', id);

    if (!employeeApprover) {
      logger.warn('EmployeeApprover[%s] does not exist', id);
      throw new NotFoundError({
        message: 'Employee approver you are attempting to delete does not exist'
      });
    }
    deletedEmployeeApprover = await repository.deleteOne({ id });
    logger.info('EmployeeApprover[%s] successfully deleted!', id);

    // Emit event.EmployeeApprover.deleted event
    logger.debug(`Emitting ${events.deleted} event`);
    kafkaService.send(events.deleted, deletedEmployeeApprover);
    logger.info(`${events.deleted} event created successfully!`);

    return deletedEmployeeApprover;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn('Deleting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}