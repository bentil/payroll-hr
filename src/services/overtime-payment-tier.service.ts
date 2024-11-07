import { OvertimePaymentTier } from '@prisma/client';
import { OvertimePaymentTierEvent } from '../domain/events/overtime-payment-tier.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/overtime-payment-tier.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'OvertimePaymentTierService' });

export async function createOrUpdateOvertimePaymentTier(
  data: Omit<OvertimePaymentTierEvent, 'createdAt' | 'modifiedAt'>
): Promise<OvertimePaymentTier> {
  logger.debug(
    'Saving OvertimePaymentTier[%s]',
    data.id,
  );
  const overtimePaymentTier = await repository.createOrUpdate({
    id: data.id,
    overtimeId: data.overtimeId,
    type: data.type,
    fixedComponent: data.fixedComponent,
    factorComponent: data.factorComponent,
    minHours: data.minHours,
    maxHours: data.maxHours,
    currencyId: data.currencyId
  });
  logger.info(
    'OvertimePaymentTier[%s] saved',
    data.id
  );

  return overtimePaymentTier;
}

export async function getOvertimePaymentTier(id: number): Promise<OvertimePaymentTier> {
  logger.debug('Getting details for OvertimePaymentTier[%s]', id);
  let overtimePaymentTier: OvertimePaymentTier | null;

  try {
    overtimePaymentTier = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting OvertimePaymentTier[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!overtimePaymentTier) {
    throw new NotFoundError({
      name: errors.OVERTIME_PAYMENT_TIER_NOT_FOUND,
      message: 'Overtime payment tier does not exist'
    });
  }

  logger.info('OvertimePaymentTier[%s] details retrieved!', id);
  return overtimePaymentTier;
}

export async function deleteOvertimePaymentTier(id: number): Promise<void> {
  const overtimePaymentTier = await repository.findOne({ id });
  if (!overtimePaymentTier) {
    logger.warn('OvertimePaymentTier[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.OVERTIME_PAYMENT_TIER_NOT_FOUND,
      message: 'Overtime payment tier to delete does not exisit'
    });
  }

  logger.debug('Deleting OvertimePaymentTier[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('OvertimePaymentTier[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting OvertimePaymentTier[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}