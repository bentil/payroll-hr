import { CompanyLevel } from '@prisma/client';
import * as repository from '../repositories/company-level.repository';
import {
  NotFoundError,
  ServerError
} from '../errors/http-errors';
import { AuthorizedUser } from '../domain/user.domain'; 
import { rootLogger } from '../utils/logger';
import { errors } from '../utils/constants';
import { CompanyLevelEvent } from '../domain/events/company-level.event';

const logger = rootLogger.child({ context: 'CompanyLevelService' });

export async function createOrUpdateCompanyLevel(
  data: Omit<CompanyLevelEvent, 'createdAt' | 'modifiedAt'>
): Promise<CompanyLevel> {
  logger.debug('Saving CompanyLevel[%s]', data.id);
  const companyLevel = await repository.createOrUpdate({
    id: data.id,
    companyId: data.companyId,
    organizationId: data.organizationId,
    levelNumber: data.levelNumber,
    levelName: data.levelName,
    juniorLevel: data.juniorLevel,
    parentId: data.parentId,
    childId: data.childId,
  });
  logger.info('CompanyLevel[%s] saved', data.id);

  return companyLevel;
}

export async function getCompanyLevelById(
  id: number,
): Promise<CompanyLevel> {
  logger.debug('Getting details for CompanyLevel[%s]', id);

  let companyLevel: CompanyLevel | null;
  try {
    companyLevel = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting CompanyLevel[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyLevel) {
    logger.warn('CompanyLevel[%s] does not exist', id);
    throw new NotFoundError({ message: 'Company level does not exist' });
  }

  logger.info('CompanyLevel[%s] details retrieved!', id);
  return companyLevel;
}

export async function validateCompanyLevel(
  id: number,
  authorizedUser: AuthorizedUser,
  options?: {
    companyId?: number,
    companyIds?: number[]
  }): Promise<CompanyLevel> {
  logger.debug('Validating details for CompanyLevel[%s]', id);

  const distinctIds = new Set<number>(options?.companyIds);

  let companyIdQuery: {
    companyId?: number | { in: number[] };
  };
  if (options?.companyId) {
    companyIdQuery = {
      companyId: options?.companyId
    };
  } else {
    companyIdQuery = {
      companyId: { in: [...distinctIds] }
    };
  }

  let companyLevel: CompanyLevel | null;
  try {
    companyLevel = await repository.findFirst({
      id,
      ...companyIdQuery
    });
  } catch (err) {
    logger.warn('Getting CompanyLevel[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyLevel) {
    logger.warn('CompanyLevel[%s] does not exist', id);
    throw new NotFoundError({ message: 'Company level(s) does not exist' });
  }

  logger.info('CompanyLevel[%s] details retrieved!', id);
  return companyLevel;
}

export async function validateCompanyLevels(
  companyLevelIds: number[]
): Promise<void> {
  const companyList = new Set<number>(companyLevelIds);

  const foundEmployees = await repository.find({
    where: { id: { in: [...companyLevelIds] } }
  });

  if (foundEmployees.data.length !== companyList.size) {
    logger.warn(
      'Received %d employees id(s), but found %d',
      companyList.size, foundEmployees.data.length
    );
    throw new NotFoundError({
      name: errors.COMPANY_LEVEL_NOT_FOUND,
      message: 'At least one Employee Id passed does not exist'
    });
  }
}

export async function deleteCompanyLevel(id: number): Promise<void> {
  const companyLevel = await repository.findOne({ id });
  if (!companyLevel) {
    logger.warn('CompanyLevel[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.COMPANY_LEVEL_NOT_FOUND,
      message: 'Company level to delete does not exisit'
    });
  }

  logger.debug('Deleting CompanyLevel[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('CompanyLevel[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting CompanyLevel[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}