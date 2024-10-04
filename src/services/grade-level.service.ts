import { GradeLevel, Prisma } from '@prisma/client';
import { GradeLevelEvent } from '../domain/events/grade-level.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/grade-level';
import { ListWithPagination } from '../repositories/types';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'GradeLevelService' });

export async function createOrUpdateGradeLevel(
  data: Omit<GradeLevelEvent, 'createdAt' | 'modifiedAt'>
): Promise<GradeLevel> {
  logger.debug(
    'Saving GradeLevel[%s]',
    data.id,
  );
  const gradeLevel = await repository.createOrUpdate({
    id: data.id,
    companyId: data.companyId,
    companyLevelId: data.companyLevelId,
    name: data.name,
    code: data.code,
    description: data.description,
    type: data.type
  });
  logger.info(
    'GradeLevel[%s] saved',
    data.id
  );

  return gradeLevel;
}

export async function getGradeLevels(
  where: Prisma.GradeLevelWhereInput,
): Promise<ListWithPagination<GradeLevel>> {
  let gradeLevel: ListWithPagination<GradeLevel>;
  logger.debug('Finding GradeLevel(s) that match query', { where });
  try {
    gradeLevel = await repository.find({ where });
    logger.info(
      'Found %d GradeLevel that matched query',
      gradeLevel.data.length, { where }
    );
  } catch (err) {
    logger.warn(
      'Querying GradeLevel with query failed',
      { where }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return gradeLevel;
}

export async function getGradeLevelById(id: number): Promise<GradeLevel> {
  logger.debug('Getting details for GradeLevel[%s]', id);

  let gradeLevel: GradeLevel | null;
  try {
    gradeLevel = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting GradeLevel[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!gradeLevel) {
    logger.warn('GradeLevel[%s] does not exist', id);
    throw new NotFoundError({ message: 'Grade level does not exist' });
  }
  logger.info('GradeLevel[%s] details retrieved!', id);
  return gradeLevel;
}

export async function validateGradeLevels(
  gradeLevelIds: number[],
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

  const distinctIds = new Set<number>(gradeLevelIds);
  const gradeLevels = await repository.find({
    where: {
      id: { in: [...distinctIds] },
      ...companyIdQuery,
    }
  });

  if (gradeLevels.data.length !== distinctIds.size) {
    logger.warn(
      'Received %d companyLevelIds id(s), but found %d',
      distinctIds.size, gradeLevels.data.length
    );
    throw new NotFoundError({
      name: errors.GRADE_LEVEL_NOT_FOUND,
      message: 'At least one grade level ID passed does not exist for company'
    });
  }
}