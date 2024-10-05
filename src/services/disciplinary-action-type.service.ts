import { DisciplinaryActionType } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateDisciplinaryActionTypeDto,
  QueryDisciplinaryActionTypeDto,
  UpdateDisciplinaryActionTypeDto,
  SearchDisciplinaryActionTypeDto,
} from '../domain/dto/disciplinary-action-type.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { 
  FailedDependencyError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import * as repository from '../repositories/disciplinary-action-type.repository';
import { ListWithPagination } from '../repositories/types';
import * as payrollCompanyService from '../services/payroll-company.service';
import { errors } from '../utils/constants';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'DisciplinaryActionTypeService' });
const events = {
  created: 'event.DisciplinaryActionType.created',
  modified: 'event.DisciplinaryActionType.modified',
  deleted: 'event.DisciplinaryActionType.deleted',
} as const;

export async function addDisciplinaryActionType(
  creatData: CreateDisciplinaryActionTypeDto
): Promise<DisciplinaryActionType> {
  const { companyId } = creatData;

  try {
    await payrollCompanyService.getPayrollCompany(companyId);
  } catch (err) {
    logger.warn('Getting PayrollCompany[%s] failed', companyId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('PayrollCompany[%s] exists', companyId);
 
  logger.debug('Adding new DisciplinaryAction type to the database...');
  let newDisciplinaryActionType: DisciplinaryActionType;
  try {
    newDisciplinaryActionType = await repository.create(creatData);
    logger.info(
      'DisciplinaryActionType[%s] added successfully!',
      newDisciplinaryActionType.id
    );
  } catch (err) {
    logger.error('Adding DisciplinaryActionType failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.DisciplinaryActionType.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newDisciplinaryActionType);
  logger.info(`${events.created} event created successfully!`);

  return newDisciplinaryActionType;
}

export async function getDisciplinaryActionTypes(
  query: QueryDisciplinaryActionTypeDto
): Promise<ListWithPagination<DisciplinaryActionType>> {
  const {
    page,
    limit: take,
    orderBy,
    companyId,
    code,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<DisciplinaryActionType>;
  try {
    logger.debug('Finding DisciplinaryActionType(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { companyId, code },
      orderBy: orderByInput,
    });
    logger.info(
      'Found %d DisciplinaryActionType(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying DisciplinaryActionType with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getDisciplinaryActionType(id: number): Promise<DisciplinaryActionType> {
  logger.debug('Getting details for DisciplinaryActionType[%s]', id);
  let disciplinaryActionType: DisciplinaryActionType | null;

  try {
    disciplinaryActionType = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting DisciplinaryActionType[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!disciplinaryActionType) {
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_TYPE_NOT_FOUND,
      message: 'Disciplinary action type does not exist'
    });
  }

  logger.info('DisciplinaryActionType[%s] details retrieved!', id);
  return disciplinaryActionType;
}

export async function searchDisciplinaryActionTypes(
  query: SearchDisciplinaryActionTypeDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<DisciplinaryActionType>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});

  let result: ListWithPagination<DisciplinaryActionType>;
  try {
    logger.debug('Finding DisciplinaryActionType(s) that matched search query', { query });
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        ...scopedQuery,
        description: {
          search: searchParam,
        },
        code: {
          search: searchParam,
        },
        name: {
          search: searchParam,
        },
      },
    });
    logger.info('Found %d DisciplinaryActionType(s) that matched query', { query });
  } catch (err) {
    logger.warn(
      'Searching DisciplinaryActionTypes with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateDisciplinaryActionType(
  id: number, 
  updateData: UpdateDisciplinaryActionTypeDto
): Promise<DisciplinaryActionType> {
  const disciplinaryActionType = await repository.findOne({ id });
  if (!disciplinaryActionType) {
    logger.warn('DisciplinaryActionType[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_TYPE_NOT_FOUND,
      message: 'Disciplinary action type to update does not exisit'
    });
  }

  logger.debug('Persisting update(s) to DisciplinaryActionType[%s]', id);
  const updatedDisciplinaryActionType = await repository.update({
    where: { id }, data: updateData
  });
  logger.info('Update(s) to DisciplinaryActionType[%s] persisted successfully!', id);

  // Emit event.DisciplinaryActionType.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedDisciplinaryActionType);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedDisciplinaryActionType;
}

export async function deleteDisciplinaryActionType(id: number): Promise<void> {
  const disciplinaryActionType = await repository.findOne({ id });
  if (!disciplinaryActionType) {
    logger.warn('DisciplinaryActionType[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_TYPE_NOT_FOUND,
      message: 'Disciplinary action type to delete does not exisit'
    });
  }

  logger.debug('Deleting DisciplinaryActionType[%s] from database...', id);
  let deletedActionType: DisciplinaryActionType;
  try {
    deletedActionType = await repository.deleteOne({ id });
    logger.info('DisciplinaryActionType[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting DisciplinaryActionType[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.DisciplinaryActionType.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedActionType);
  logger.info(`${events.deleted} event created successfully!`);
}