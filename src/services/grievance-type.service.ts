import { GrievanceType } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateGrievanceTypeDto,
  QueryGrievanceTypeDto,
  UpdateGrievanceTypeDto,
  SearchGrievanceTypeDto,
} from '../domain/dto/grievance-type.dto';
import * as grievanceTypeRepository from '../repositories/grievance-type.repository';
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

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceType' });

const events = {
  created: 'event.GrievanceType.created',
  modified: 'event.GrievanceType.modified',
};

export async function addGrievanceType(creatData: CreateGrievanceTypeDto): Promise<GrievanceType> {
  const { companyId } = creatData;

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
 
  logger.debug('Adding new Grievance type to the database...');

  let newGrievanceType: GrievanceType;
  try {
    newGrievanceType = await grievanceTypeRepository.create(creatData);
    logger.info('GrievanceType[%s] added successfully!', newGrievanceType.id);
  } catch (err) {
    logger.error('Adding grievanceType failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.GrievanceType.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newGrievanceType);
  logger.info(`${events.created} event created successfully!`);

  return newGrievanceType;
}

export async function getGrievanceTypes(
  query: QueryGrievanceTypeDto
): Promise<ListWithPagination<GrievanceType>> {
  const {
    page,
    limit: take,
    orderBy,
    companyId,
    code,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<GrievanceType>;
  try {
    logger.debug('Finding GrievanceType(s) that matched query', { query });
    result = await grievanceTypeRepository.find({
      skip,
      take,
      where: { companyId, code },
      orderBy: orderByInput,
    });
    logger.info('Found %d GrievanceType(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying GrievanceType with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getGrievanceType(id: number): Promise<GrievanceType> {
  logger.debug('Getting details for GrievanceType[%s]', id);
  let grievanceType: GrievanceType | null;

  try {
    grievanceType = await grievanceTypeRepository.findOne({ id });
  } catch (err) {
    logger.warn('Getting GreivanceType[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!grievanceType) {
    throw new NotFoundError({
      name: errors.GRIEVANCE_TYPE_NOT_FOUND,
      message: 'GrievanceType does not exist'
    });
  }

  logger.info('GrievanceType[%s] details retrieved!', id);
  return grievanceType;
}

export async function searchGrievanceType(
  query: SearchGrievanceTypeDto
): Promise<ListWithPagination<GrievanceType>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 

  let result: ListWithPagination<GrievanceType>;
  try {
    logger.debug('Finding GrievanceType(s) that matched search query', { query });
    result = await grievanceTypeRepository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
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
    logger.info('Found %d GrievanceType(s) that matched query', { query });
  } catch (err) {
    logger.warn('Searching GrievanceType with query failed', { query }, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateGrievanceType(
  id: number, 
  updateData: UpdateGrievanceTypeDto
): Promise<GrievanceType> {
  const { companyId } = updateData;
  const grievanceType = await grievanceTypeRepository.findOne({ id });
  if (!grievanceType) {
    logger.warn('GrievanceType[%s] to udate does not exist', id);
    throw new NotFoundError({
      name: errors.GRIEVANCE_TYPE_NOT_FOUND,
      message: 'Grievance type to update does not exisit'
    });
  }

  //check if provided companyId  exists
  if (companyId) {
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
  }

  logger.debug('Persisting update(s) to GrievanceType[%s]', id);
  const updatedGrievanceType = await grievanceTypeRepository.update({
    where: { id }, data: updateData
  });
  logger.info('Update(s) to GrievanceType[%s] persisted successfully!', id);

  // Emit event.GrievanceType.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updateGrievanceType);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedGrievanceType;
}

export async function deleteGrievanceType(id: number): Promise<void> {
  const grievanceType = await grievanceTypeRepository.findOne({ id });
  if (!grievanceType) {
    logger.warn('GrievanceType[%s] to udate does not exist', id);
    throw new NotFoundError({
      name: errors.GRIEVANCE_TYPE_NOT_FOUND,
      message: 'Grievance type to update does not exisit'
    });
  }

  logger.debug('Deleting GrievanceType[%s] from database...', id);
  try {
    await grievanceTypeRepository.deleteGrievanceType({ id });
    logger.info('GrievanceType[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting GrievanceType[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}