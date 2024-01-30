import { CurrencyEvent } from '../domain/events/currency.events';
import * as currencyService from '../services/currency.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'CurrencyConsumer' });

export default class CurrencyConsumer {
  public static async handleCreated(data: CurrencyEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle Currency created', { data });
    try {
      const { id } = await currencyService.createOrUpdateCurrency(data);
      logger.info('Currency[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up Currency[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: CurrencyEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle Currency modified', { data });
    try {
      const { id } = await currencyService.createOrUpdateCurrency(data);
      logger.info('Currency[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save Currency[%s]', data.id, { error: err });
      throw err;
    }
  }
}