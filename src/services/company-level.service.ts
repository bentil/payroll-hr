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
    throw new NotFoundError({ message: 'CompanyLevel does not exist' });
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
    throw new NotFoundError({ message: 'CompanyLevel(s) does not exist' });
  }

  logger.info('CompanyLevel[%s] details retrieved!', id);
  return companyLevel;
}

export async function validateCompanyLevels(
  companyLevelIds: number[],
  options?: {
    companyId?: number,
    companyIds?: number[]
  }
): Promise<void> {

  const distinctCompanyIds = new Set<number>(options?.companyIds);
  let companyIdQuery: {
    companyId?: number | { in: number[] };
  };
  if (options?.companyId) {
    companyIdQuery = {
      companyId: options?.companyId
    };
  } else {
    companyIdQuery = {
      companyId: { in: [...distinctCompanyIds] }
    };
  }

  const distinctIds = new Set<number>(companyLevelIds);
  const companyLevels = await repository.find({
    where: {
      id: { in: [...distinctIds] },
      ...companyIdQuery,
    }
  });

  if (companyLevels.data.length !== distinctIds.size) {
    logger.warn(
      'Received %d companyLevelIds id(s), but found %d',
      distinctIds.size, companyLevels.data.length
    );
    throw new NotFoundError({
      name: errors.COMPANY_LEVEL_NOT_FOUND,
      message: 'At least one company level ID passed does not exist for company'
    });
  }
}