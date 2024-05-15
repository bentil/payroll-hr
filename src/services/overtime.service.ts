import { Overtime } from '@prisma/client';
import { OvertimeEvent } from '../domain/events/overtime.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/overtime.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'OvertimeService' });

export async function createOrUpdateOvertime(
  data: Omit<OvertimeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Overtime> {
  logger.debug(
    'Saving Overtime[%s]',
    data.id,
  );
  const overtime = await repository.createOrUpdate({
    id: data.id,
    code: data.code,
    description: data.description,
    name: data.name,
    active: data.active,
    companyId: data.companyId,
    employeeBandId: data.employeeBandId,
    minHoursRequired: data.minHoursRequired,
    maxHoursPermitted: data.maxHoursPermitted,
    taxable : data.taxable
  });
  logger.info(
    'Overtime[%s] saved',
    data.id
  );

  return overtime;
}

export async function getOvertime(id: number): Promise<Overtime> {
  logger.debug('Getting details for Overtime[%s]', id);
  let overtime: Overtime | null;

  try {
    overtime = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting Overtime[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!overtime) {
    throw new NotFoundError({
      name: errors.OVERTIME_NOT_FOUNT,
      message: 'Overtime does not exist'
    });
  }

  logger.info('Overtime[%s] details retrieved!', id);
  return overtime;
}

export async function deleteOvertime(id: number): Promise<void> {
  const overtime = await repository.findOne({ id });
  if (!overtime) {
    logger.warn('Overtime[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.OVERTIME_NOT_FOUNT,
      message: 'Overtime to delete does not exisit'
    });
  }

  logger.debug('Deleting Overtime[%s] from database...', id);
  try {
    await repository.deleteOvertime({ id });
    logger.info('Overtime[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Overtime[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}