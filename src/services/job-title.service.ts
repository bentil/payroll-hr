import { JobTitle } from '@prisma/client';
import { JobTitleEvent } from '../domain/events/job-title.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/job-title.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'JobTitleService' });
export async function createOrUpdateJobTitle(
  data: Omit<JobTitleEvent, 'createdAt' | 'modifiedAt'>
): Promise<JobTitle> {
  logger.debug('Saving JobTitle[%s]', data.id );

  const jobTitle = await repository.createOrUpdate({
    id: data.id,
    organizationId: data.organizationId,
    companyId:data.companyId,
    employeeBandId: data.employeeBandId,
    name: data.name,
    code: data.code,
    description: data.description,
    companyLevelId: data.companyLevelId,
    minimumAge: data.minimumAge,
    maximumAge: data.maximumAge,
    minimumExperienceYears: data.minimumExperienceYears,
    acceptDisability: data.acceptDisability,
  });
  logger.info(
    'JobTitle[%s] saved',
    data.id
  );

  return jobTitle;
}

export async function getJobTitle(id: number): Promise<JobTitle> {
  logger.debug('Getting details for JobTitle[%s]', id);
  let jobTitle: JobTitle | null;

  try {
    jobTitle = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting JobTitle[%s] failed', id);
    throw new ServerError({ message: (err as Error).message });
  }

  if (!jobTitle) {
    throw new NotFoundError({
      name: errors.JOB_TITLE_NOT_FOUND,
      message: 'Job title does not exist'
    });
  }

  return jobTitle;
}