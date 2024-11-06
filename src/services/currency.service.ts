import { Currency } from '@prisma/client';
import { CurrencyEvent } from '../domain/events/currency.events';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/currency.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'CompanyCurrencyService' });

export async function createOrUpdateCurrency(
  data: Omit<CurrencyEvent, 'createdAt' | 'modifiedAt'>
): Promise<Currency> {
  logger.debug(
    'Saving Currency[%s]',
    data.id,
  );
  const currency = await repository.createOrUpdate({
    id: data.id,
    code: data.code,
    symbol: data.symbol,
    name: data.name,
    active: data.active,
    isDefault: data.isDefault,
  });
  logger.info(
    'Currency[%s] saved',
    data.id
  );

  return currency;
}

export async function getCurrency(id: number): Promise<Currency> {
  logger.debug('Getting details for Currency[%s]', id);
  let currency: Currency | null;

  try {
    currency = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting Currency[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!currency) {
    throw new NotFoundError({
      name: errors.CURRENCY_NOT_FOUND,
      message: 'Currency does not exist'
    });
  }

  logger.info('Currency[%s] details retrieved!', id);
  return currency;
}

export async function deleteCurrency(id: number): Promise<void> {
  const currency = await repository.findOne({ id });
  if (!currency) {
    logger.warn('Currency[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.CURRENCY_NOT_FOUND,
      message: 'Currency to delete does not exisit'
    });
  }

  logger.debug('Deleting Currency[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('Currency[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Currency[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}