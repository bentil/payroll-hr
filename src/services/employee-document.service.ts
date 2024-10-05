import { EmployeeDocument } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateEmployeeDocumentDto,
  EmployeeDocumentDto,
  QueryEmployeeDocumentDto,
  UpdateEmployeeDocumentDto
} from '../domain/dto/employee-document.dto';
import * as repository from '../repositories/employee-document.repository';
import * as employeeService from '../services/employee.service';
import * as typeService from './company-document-type.service';
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

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeDocumentService' });

const events = {
  created: 'event.EmployeeDocument.created',
  modified: 'event.EmployeeDocument.modified',
  deleted: 'event.EmployeeDocument.deleted'
} as const;

export async function addEmployeeDocument(
  creatData: CreateEmployeeDocumentDto,
  authorizedUser: AuthorizedUser,
): Promise<EmployeeDocumentDto> {
  const { employeeId, typeId } = creatData;

  // VALIDATION
  try {
    await Promise.all([
      employeeService.getEmployee(employeeId),
      typeService.getCompanyDocumentType(typeId, authorizedUser)
    ]);
  } catch (err) {
    logger.warn('Getting Employee[%s] or EmployeeDocumentType[%s]fialed', employeeId, typeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Employee[%s] or EmployeeDocumentType[%s] exists', employeeId, typeId);
 
  logger.debug('Adding new EmployeeDocument to the database...');

  let newEmployeeDocument: EmployeeDocumentDto;
  try {
    newEmployeeDocument = await repository.create(
      creatData, 
      { employee: true, documentType: true }
    );
    logger.info('EmployeeDocument[%s] added successfully!', newEmployeeDocument.id);
  } catch (err) {
    logger.error('Adding EmployeeDocument failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.EmployeeDocument.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newEmployeeDocument);
  logger.info(`${events.created} event created successfully!`);

  return newEmployeeDocument;
}

export async function getEmployeeDocuments(
  query: QueryEmployeeDocumentDto,
  authorizedUser: AuthorizedUser,
): Promise<ListWithPagination<EmployeeDocumentDto>> {
  const {
    page,
    limit: take,
    orderBy,
    ...queryParams
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
    authorizedUser, queryParams
  );


  let result: ListWithPagination<EmployeeDocumentDto>;
  try {
    logger.debug('Finding EmployeeDocument(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: scopedQuery,
      orderBy: orderByInput,
      include: { employee: true, documentType: true }
    });
    logger.info('Found %d EmployeeDocument(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying EmployeeDocument with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getEmployeeDocument(
  id: number,
  authorizedUser: AuthorizedUser
): Promise<EmployeeDocumentDto> {
  logger.debug('Getting details for EmployeeDocument[%s]', id);
  let employeeDocument: EmployeeDocument | null;
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(authorizedUser, { id });

  try {
    employeeDocument = await repository.findFirst(
      scopedQuery, { employee: true, documentType: true }
    );
  } catch (err) {
    logger.warn('Getting EmployeeDocument[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeDocument) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_DOCUMENT_NOT_FOUND,
      message: 'Employee document does not exist'
    });
  }

  logger.info('EmployeeDocument[%s] details retrieved!', id);
  return employeeDocument;
}

export async function updateEmployeeDocument(
  id: number, 
  updateData: UpdateEmployeeDocumentDto,
  authorizedUser: AuthorizedUser
): Promise<EmployeeDocumentDto> {
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(authorizedUser, { id });
  const { employeeId, typeId } = updateData;
  const employeeDocument = await repository.findFirst(scopedQuery);
  if (!employeeDocument) {
    logger.warn('EmployeeDocument[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_DOCUMENT_NOT_FOUND,
      message: 'Employee document to update does not exist'
    });
  }

  try {
    await Promise.all([
      employeeId ? employeeService.getEmployee(employeeId) : undefined,
      typeId ? typeService.getCompanyDocumentType(typeId, authorizedUser) : undefined
    ]);
  } catch (err) {
    logger.warn('Getting Employee[%s] or EmployeeDocumentType[%s]fialed', employeeId, typeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to EmployeeDocument[%s]', id);
  const updatedEmployeeDocument = await repository.update({
    where: { id }, data: updateData
  });
  logger.info('Update(s) to EmployeeDocument[%s] persisted successfully!', id);

  // Emit event.EmployeeDocument.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeDocument);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeDocument;
}

export async function deleteEmployeeDocument(
  id: number, 
  authorizedUser: AuthorizedUser
): Promise<void> {
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(authorizedUser, { id });
  const employeeDocument = await repository.findFirst(scopedQuery);
  let deletedEmployeeDocument: EmployeeDocument;
  if (!employeeDocument) {
    logger.warn('EmployeeDocument[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_DOCUMENT_NOT_FOUND,
      message: 'Employee document to delete does not exisit'
    });
  }

  logger.debug('Deleting EmployeeDocument[%s] from database...', id);
  try {
    deletedEmployeeDocument = await repository.deleteOne({ id });
    logger.info('EmployeeDocument[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting EmployeeDocument[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeDocument.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedEmployeeDocument);
  logger.info(`${events.deleted} event created successfully!`);
}