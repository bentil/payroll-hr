import { CompanyLevelLeavePackage } from '@prisma/client';
import {
  CreateCompanyLevelLeavePackageDto,
  QueryCompanyLevelLeavePackageDto,
  CompanyLevelLeavePackageDto
} from '../domain/dto/company-level-leave-package.dto';
import * as repository from '../repositories/company-level-leave-package.repository';
import { HttpError, NotFoundError, ServerError } from '../errors/http-errors';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import * as leavePackageService from './leave-package.service';
import * as companyLevelService from './company-level.service';
import { ListWithPagination } from '../repositories/types';
import { KafkaService } from '../components/kafka.component';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'CompanyLevelLeavePackageService' });

const events = {
  created: 'event.DisciplinaryActionType.created',
  modified: 'event.DisciplinaryActionType.modified',
};

export async function createCompanyLevelLeavePackage(
  createCompanyLevelLeavePackageDto: CreateCompanyLevelLeavePackageDto,
): Promise<CompanyLevelLeavePackageDto[]> {
  const { companyLevelId, leavePackageIds } = createCompanyLevelLeavePackageDto;

  logger.debug(
    'Validating companyLevelId[%s] and leavePackageIds[%s]',
    companyLevelId, leavePackageIds
  );
  try {
    await Promise.all(
      [
        companyLevelService.getCompanyLevelById(companyLevelId),
        // eslint-disable-next-line max-len
        leavePackageService.validateLeavePackageIds(leavePackageIds)
      ]);
    logger.info(
      'Validating companyLevelId[%s] and leavePackageIds[%s] was successful',
      companyLevelId, leavePackageIds
    );
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error(
      // eslint-disable-next-line max-len
      'Validating companyLevelId[%s] and leavePackageIds[%s] for CompanyLevelLeavePackage creation failed',
      companyLevelId, leavePackageIds, { error: err }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  logger.debug('Persisting new CompanyLevelLeavePackage for companyLevelId[%s]', companyLevelId);
  let companyLevelLeavePackages: CompanyLevelLeavePackageDto[];
  const companyLevelLeavePackageInputArray = helpers.generateLeavePackageRecordsForACompanyLevel(
    leavePackageIds, companyLevelId);
  try {
    companyLevelLeavePackages = await repository.createMany(
      companyLevelLeavePackageInputArray,
      {
        leavePackage: true,
        companyLevel: true
      });
    logger.info('CompanyLevelLeavePackages with leavePackageIds[%s] persisted successfully!',
      leavePackageIds);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting CompanyLevelLeavePackage with leavePackageIds[%s] failed',
      { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.CompanyLevelLeavePackage.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, companyLevelLeavePackages);
  logger.info(`${events.created} event created successfully!`);

  return companyLevelLeavePackages;
}


export async function getCompanyLevelLeavePackages(
  query: QueryCompanyLevelLeavePackageDto,
  //authorizedUser: AuthorizedUser
): Promise<ListWithPagination<CompanyLevelLeavePackageDto>>{
  const {
    page,
    limit: take,
    orderBy,
    ...queryParam
  } = query;

  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  let companyLevelLeavePackage: ListWithPagination<CompanyLevelLeavePackageDto>;
  logger.debug('Finding CompanyLevelLeavePackage(s) that match query', { query });
  try {
    companyLevelLeavePackage = await repository.find({
      skip,
      take,
      where: {
        ...queryParam,
      },
      include: {
        leavePackage: true,
        companyLevel: true
      },
      orderBy: orderByInput
    });
    logger.info('Found %d CompanyLevelLeavePackage that matched query',
      companyLevelLeavePackage.data.length, { query });
  } catch (err) {
    logger.warn(
      'Querying CompanyLevelLeavePackages with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return companyLevelLeavePackage;
}

export const getCompanyLevelLeavePackageById = async (
  id: number, /*authorizedUser: AuthorizedUser*/
): Promise<CompanyLevelLeavePackageDto> => {
  logger.debug('Getting details for CompanyLevelLeavePackage[%s]', id);

  let companyLevelLeavePackage: CompanyLevelLeavePackageDto | null;
  try {
    companyLevelLeavePackage = await repository.findOne({ id },
      {
        leavePackage: true,
        companyLevel: true
      }
    );
  } catch (err) {
    logger.warn('Getting CompanyLevelLeavePackage[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  if (!companyLevelLeavePackage) {
    logger.warn('CompanyLevelLeavePackage[%s] does not exist', id);
    throw new NotFoundError({ message: 'CompanyLevelLeavePackage does not exist' });
  }
  logger.info('CompanyLevelLeavePackage[%s] details retrieved!', id);
  return companyLevelLeavePackage;
};


export const deleteCompanyLevelLeavePackage = async (
  id: number,
  // authorizedUser: AuthorizedUser
): Promise<CompanyLevelLeavePackageDto> => {
  logger.debug('Getting details for CompanyLevelLeavePackage[%s]', id);
  let deletedCompanyLevelLeavePackage: CompanyLevelLeavePackage | null;
  let companyLevelLeavePackage: CompanyLevelLeavePackageDto | null;
  try {
    companyLevelLeavePackage = await repository.findOne({ id });
    logger.info('CompanyLevelLeavePackage[%s] details retrieved!', id);

    if (!companyLevelLeavePackage) {
      logger.warn('CompanyLevelLeavePackage[%s] does not exist', id);
      throw new NotFoundError({ 
        message: 'CompanyLevelLeavePackage you are attempting to delete does not exist' 
      });
    }

    deletedCompanyLevelLeavePackage = await repository.deleteOne({ id });
    logger.info('CompanyLevelLeavePackage[%s] successfully deleted!', id);

    return deletedCompanyLevelLeavePackage;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn(
      'Deleting CompanyLevelLeavePackage[%s] failed', id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

};
