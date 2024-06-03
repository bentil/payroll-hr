import { CompanyDocumentType } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateCompanyDocumentTypeDto,
  QueryCompanyDocumentTypeDto,
  SearchCompanyDocumentTypeDto,
  UpdateCompanyDocumentTypeDto
} from '../domain/dto/company-document-type.dto';
import * as repository from '../repositories/company-document-type.repository';
import * as payrollCompanyService from '../services/payroll-company.service';
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
const logger = rootLogger.child({ context: 'CompanyDocumentTypeService' });

const events = {
  created: 'event.CompanyDocumentType.created',
  modified: 'event.CompanyDocumentType.modified',
  deleted: 'event.CompanyDocumentType.deleted'
};

export async function addCompanyDocumentType(
  creatData: CreateCompanyDocumentTypeDto
): Promise<CompanyDocumentType> {
  const { companyId } = creatData;

  // VALIDATION
  try {
    await payrollCompanyService.getPayrollCompany(companyId);
  } catch (err) {
    logger.warn('Getting PayrollCompany[%s] fialed', companyId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('PayrollCompany[%s] exists', companyId);
 
  logger.debug('Adding new CompanyDocumentType to the database...');

  let newCompanyDocumentType: CompanyDocumentType;
  try {
    newCompanyDocumentType = await repository.create(creatData);
    logger.info('CompanyDocumentType[%s] added successfully!', newCompanyDocumentType.id);
  } catch (err) {
    logger.error('Adding CompanyDocumentType failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.CompanyDocumentType.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newCompanyDocumentType);
  logger.info(`${events.created} event created successfully!`);

  return newCompanyDocumentType;
}

export async function getCompanyDocumentTypes(
  query: QueryCompanyDocumentTypeDto,
  authorizedUser: AuthorizedUser
): Promise<ListWithPagination<CompanyDocumentType>> {
  const {
    page,
    limit: take,
    orderBy,
    ...queryParam
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authorizedUser, queryParam);

  let result: ListWithPagination<CompanyDocumentType>;
  try {
    logger.debug('Finding CompanyDocumentType(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: scopedQuery,
      orderBy: orderByInput,
    });
    logger.info(
      'Found %d CompanyDocumentType(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying CompanyDocumentType with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getCompanyDocumentType(id: number): Promise<CompanyDocumentType> {
  logger.debug('Getting details for CompanyDocumentType[%s]', id);
  let companyDocumentType: CompanyDocumentType | null;

  try {
    companyDocumentType = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting CompanyDocumentType[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyDocumentType) {
    throw new NotFoundError({
      name: errors.COMPANY_DOCUMENT_TYPE_NOT_FOUND,
      message: 'Company document type does not exist'
    });
  }

  logger.info('CompanyDocumentType[%s] details retrieved!', id);
  return companyDocumentType;
}

export async function searchCompanyDocumentType(
  query: SearchCompanyDocumentTypeDto
): Promise<ListWithPagination<CompanyDocumentType>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 

  let result: ListWithPagination<CompanyDocumentType>;
  try {
    logger.debug('Finding CompanyDocumentType(s) that matched search query', { query });
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        description: {
          search: searchParam,
        },
        name: {
          search: searchParam,
        },
      },
    });
    logger.info('Found %d CompanyDocumentType(s) that matched query', { query });
  } catch (err) {
    logger.warn(
      'Searching CompanyDocumentType with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateCompanyDocumentType(
  id: number, 
  updateData: UpdateCompanyDocumentTypeDto
): Promise<CompanyDocumentType> {
  const companyDocumentType = await repository.findOne({ id });
  if (!companyDocumentType) {
    logger.warn('CompanyDocumentType[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.COMPANY_DOCUMENT_TYPE_NOT_FOUND,
      message: 'Company document type to update does not exist'
    });
  }

  logger.debug('Persisting update(s) to CompanyDocumentType[%s]', id);
  const updatedCompanyDocumentType = await repository.update({
    where: { id }, data: updateData
  });
  logger.info('Update(s) to CompanyDocumentType[%s] persisted successfully!', id);

  // Emit event.CompanyDocumentType.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyDocumentType);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyDocumentType;
}

export async function deleteCompanyDocumentType(id: number): Promise<void> {
  const companyDocumentType = await repository.findOne({ id });
  let deletedCompanyDocumentType: CompanyDocumentType;
  if (!companyDocumentType) {
    logger.warn('CompanyDocumentType[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.COMPANY_DOCUMENT_TYPE_NOT_FOUND,
      message: 'Company document type to delete does not exisit'
    });
  }

  logger.debug('Deleting CompanyDocumentType[%s] from database...', id);
  try {
    deletedCompanyDocumentType = await repository.deleteOne({ id });
    logger.info('CompanyDocumentType[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting CompanyDocumentType[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.CompanyDocumentType.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedCompanyDocumentType);
  logger.info(`${events.deleted} event created successfully!`);
}