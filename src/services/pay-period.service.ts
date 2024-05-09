import { PayPeriod } from '@prisma/client';
import { PayPeriodEvent } from '../domain/events/pay-period.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/pay-period.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'PayPeriodService' });

export async function createOrUpdatePayPeriod(
  data: Omit<PayPeriodEvent, 'createdAt' | 'modifiedAt'>
): Promise<PayPeriod> {
  logger.debug(
    'Saving PayPeriod[%s]',
    data.id,
  );
  const payPeriod = await repository.createOrUpdate({
    id: data.id,
    code: data.code,
    year: data.year,
    taxCodeId: data.taxCodeId,
    startDate: data.startDate,
    endDate: data.endDate,
    sequenceNumber: data.sequenceNumber,
    timePeriod: data.timePeriod,
    organizationId: data.organizationId,
    companyId: data.companyId
  });
  logger.info(
    'PayPeriod[%s] saved',
    data.id
  );

  return payPeriod;
}

export async function getPayPeriod(id: number): Promise<PayPeriod> {
  logger.debug('Getting details for PayPeriod[%s]', id);
  let payPeriod: PayPeriod | null;

  try {
    payPeriod = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting PayPeriod[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!payPeriod) {
    throw new NotFoundError({
      name: errors.PAY_PERIOD_NOT_FOUND,
      message: 'Pay period does not exist'
    });
  }

  logger.info('PayPeriod[%s] details retrieved!', id);
  return payPeriod;
}