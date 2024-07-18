import { DepartmentLeadership } from '@prisma/client';
import { DepartmentLeadershipEvent } from '../domain/events/department-leadership.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/department-leadership.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'DepartmentLeadershipService' });

export async function createOrUpdateDepartmentLeadership(
  data: Omit<DepartmentLeadershipEvent, 'createdAt' | 'modifiedAt'>
): Promise<DepartmentLeadership> {
  logger.debug(
    'Saving DepartmentLeadership[%s]',
    data.id,
  );
  const departmentLeadership = await repository.createOrUpdate({
    id: data.id,
    departmentId: data.departmentId,
    rank: data.rank,
    permanent: data.permanent,
    employeeId: data.employeeId
  });
  logger.info(
    'DepartmentLeadership[%s] saved',
    data.id
  );

  return departmentLeadership;
}

export async function getDepartmentLeadership(
  id: number, employeeId: number
): Promise<DepartmentLeadership> {
  logger.debug('Getting details for DepartmentLeadership[%s]', id);
  let departmentLeadership: DepartmentLeadership | null;

  try {
    departmentLeadership = await repository.findOne({ id, employeeId });
  } catch (err) {
    logger.warn('Getting DepartmentLeadership[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!departmentLeadership) {
    throw new NotFoundError({
      name: errors.DEPARTMENT_LEADERSHIP_NOT_FOUND,
      message: 'DepartmentLeadership does not exist'
    });
  }

  logger.info('DepartmentLeadership[%s] details retrieved!', id);
  return departmentLeadership;
}

export async function getDepartmentLeadershipWithEmployeeId(
  employeeId: number, rank: number
): Promise<DepartmentLeadership> {
  logger.debug('Getting details for DepartmentLeadership of employee[%s]', employeeId);
  let departmentLeadership: DepartmentLeadership | null;

  try {
    departmentLeadership = await repository.findFirst({ employeeId, rank });
  } catch (err) {
    logger.warn(
      'Getting DepartmentLeadership of employee[%s] failed', 
      employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!departmentLeadership) {
    throw new NotFoundError({
      name: errors.DEPARTMENT_LEADERSHIP_NOT_FOUND,
      message: 'Department leadership does not exist'
    });
  }

  logger.info('DepartmentLeadership for employee[%s] details retrieved!', employeeId);
  return departmentLeadership;
}

export async function deleteDepartmentLeadership(id: number): Promise<void> {
  const departmentLeadership = await repository.findOne({ id });
  if (!departmentLeadership) {
    logger.warn('DepartmentLeadership[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.DEPARTMENT_NOT_FOUND,
      message: 'Department leadership to delete does not exisit'
    });
  }

  logger.debug('Deleting DepartmentLeadership[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('DepartmentLeadership[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting DepartmentLeadership[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}