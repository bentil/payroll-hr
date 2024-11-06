import { CompanyCurrency } from '@prisma/client';
import { CompanyCurrencyEvent } from '../domain/events/company-currency.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/company-currency.repository';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';


const logger = rootLogger.child({ context: 'CompanyCurrencyService' });

export async function createOrUpdateCompanyCurrency(
  data: Omit<CompanyCurrencyEvent, 'createdAt' | 'modifiedAt'>
): Promise<CompanyCurrency> {
  logger.debug(
    'Saving CompanyCurrency[%s]',
    data.id,
  );
  const companyCurrency = await repository.createOrUpdate({
    id: data.id,
    companyId: data.companyId,
    baseCurrencyId: data.baseCurrencyId,
    currencyId: data.currencyId,
    buyRate: data.buyRate,
    sellRate: data.sellRate,
  });
  logger.info(
    'CompanyCurrency[%s] saved',
    data.id
  );

  return companyCurrency;
}

export async function getCompanyCurrency(
  id: number,
  options?: {
    includeCurrency?: boolean;
  }
): Promise<CompanyCurrencyEvent> {
  logger.debug('Getting details for CompanyCurrency[%s]', id);
  let companyCurrency: CompanyCurrencyEvent | null;

  try {
    companyCurrency = await repository.findOne(
      { id },
      options?.includeCurrency ? { currency: true } : undefined,
    );
  } catch (err) {
    logger.warn('Getting CompanyCurrency[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyCurrency) {
    throw new NotFoundError({
      name: errors.COMPANY_CURRENCY_NOT_FOUND,
      message: 'Company currency does not exist'
    });
  }

  logger.info('CompanyCurrency[%s] details retrieved!', id);
  return companyCurrency;
}

export async function deleteCompanyCurrency(id: number): Promise<void> {
  const companyCurrency = await repository.findOne({ id });
  if (!companyCurrency) {
    logger.warn('CompanyCurrency[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.COMPANY_CURRENCY_NOT_FOUND,
      message: 'Company currency to delete does not exisit'
    });
  }

  logger.debug('Deleting CompanyCurrency[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('CompanyCurrency[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting CompanyCurrency[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}