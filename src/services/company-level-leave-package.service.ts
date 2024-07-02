import { CompanyLevelLeavePackage } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CompanyLevelLeavePackageDto,
  CreateCompanyLevelLeavePackageDto,
  QueryCompanyLevelLeavePackageDto,
} from '../domain/dto/company-level-leave-package.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { HttpError, NotFoundError, ServerError } from '../errors/http-errors';
import * as repository from '../repositories/company-level-leave-package.repository';
import { ListWithPagination } from '../repositories/types';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import * as companyLevelService from './company-level.service';
import * as leavePackageService from './leave-package.service';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'CompanyLevelLeavePackageService' });
const events = {
  created: 'event.CompanyLevelLeavePackage.created',
  modified: 'event.CompanyLevelLeavePackage.modified',
} as const;

export async function createCompanyLevelLeavePackage(
  createCompanyLevelLeavePackageDto: CreateCompanyLevelLeavePackageDto,
  authorizedUser: AuthorizedUser
): Promise<CompanyLevelLeavePackageDto[]> {
  const { companyLevelId, leavePackageIds } = createCompanyLevelLeavePackageDto;
  const { companyIds } = authorizedUser;

  logger.debug(
    'Validating CompanyLevelId[%s] and LeavePackageIds[%s]',
    companyLevelId, leavePackageIds
  );
  try {
    await Promise.all([
      companyLevelService.validateCompanyLevel(
        companyLevelId,
        authorizedUser,
        { companyIds }
      ),
      leavePackageService.validateLeavePackageIds(
        leavePackageIds,
        { companyIds }
      )
    ]);
    logger.info(
      'Validating CompanyLevelId[%s] and LeavePackageIds[%s] was successful',
      companyLevelId, leavePackageIds
    );
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error(
      'Validating CompanyLevelId[%s] and LeavePackageIds[%s] ' +
      'for CompanyLevelLeavePackage creation failed',
      companyLevelId, leavePackageIds, { error: err }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  logger.debug('Persisting new CompanyLevelLeavePackage for CompanyLevelId[%s]', companyLevelId);
  let companyLevelLeavePackages: CompanyLevelLeavePackageDto[];
  const companyLevelLeavePackageInputArray = helpers
    .generateLeavePackageRecordsForACompanyLevel(leavePackageIds, companyLevelId);
  try {
    companyLevelLeavePackages = await repository.createMany(
      companyLevelLeavePackageInputArray,
      {
        leavePackage: true,
        companyLevel: true
      });
    logger.info('CompanyLevelLeavePackages with LeavePackageIds[%s] persisted successfully!',
      leavePackageIds);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting CompanyLevelLeavePackage with LeavePackageIds[%s] failed',
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
        leavePackage: { include: { leaveType: true } },
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

export async function getCompanyLevelLeavePackageById(
  id: number, /*authorizedUser: AuthorizedUser*/
): Promise<CompanyLevelLeavePackageDto> {
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
    throw new NotFoundError({ message: 'Company level leave package does not exist' });
  }
  logger.info('CompanyLevelLeavePackage[%s] details retrieved!', id);
  return companyLevelLeavePackage;
}

export async function deleteCompanyLevelLeavePackage(
  id: number,
  // authorizedUser: AuthorizedUser
): Promise<CompanyLevelLeavePackageDto> {
  logger.debug('Getting details for CompanyLevelLeavePackage[%s]', id);
  let deletedCompanyLevelLeavePackage: CompanyLevelLeavePackage | null;
  let companyLevelLeavePackage: CompanyLevelLeavePackageDto | null;
  try {
    companyLevelLeavePackage = await repository.findOne({ id });
    logger.info('CompanyLevelLeavePackage[%s] details retrieved!', id);

    if (!companyLevelLeavePackage) {
      logger.warn('CompanyLevelLeavePackage[%s] does not exist', id);
      throw new NotFoundError({ 
        message: 'Company level leave package you are attempting to delete does not exist' 
      });
    }

    deletedCompanyLevelLeavePackage = await repository.deleteOne({ id });
    logger.info('CompanyLevelLeavePackage[%s] successfully deleted!', id);

    return deletedCompanyLevelLeavePackage;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn(
      'Deleting CompanyLevelLeavePackage[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}
