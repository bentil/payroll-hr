import { GradeLevel } from '@prisma/client';
import { GradeLevelEvent } from '../domain/events/grade-level.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/grade-level';

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