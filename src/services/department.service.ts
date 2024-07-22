import { Department } from '@prisma/client';
import { DepartmentEvent } from '../domain/events/department.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/department.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'DepartmentService' });

export async function createOrUpdateDepartment(
  data: Omit<DepartmentEvent, 'createdAt' | 'modifiedAt'>
): Promise<Department> {
  logger.debug(
    'Saving Department[%s]',
    data.id,
  );
  const department = await repository.createOrUpdate({
    id: data.id,
    code: data.code,
    name: data.name,
    active: data.active,
    description: data.description,
    companyId: data.companyId
  });
  logger.info(
    'Department[%s] saved',
    data.id
  );

  return department;
}

export async function getDepartment(id: number): Promise<Department> {
  logger.debug('Getting details for Department[%s]', id);
  let department: Department | null;

  try {
    department = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting Department[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!department) {
    throw new NotFoundError({
      name: errors.DEPARTMENT_NOT_FOUND,
      message: 'Department does not exist'
    });
  }

  logger.info('Department[%s] details retrieved!', id);
  return department;
}

export async function deleteDepartment(id: number): Promise<void> {
  const department = await repository.findOne({ id });
  if (!department) {
    logger.warn('Department[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.DEPARTMENT_NOT_FOUND,
      message: 'Department to delete does not exisit'
    });
  }

  logger.debug('Deleting Department[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('Department[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Department[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}