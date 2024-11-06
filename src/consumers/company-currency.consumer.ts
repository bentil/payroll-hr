import { CompanyCurrencyEvent } from '../domain/events/company-currency.event';
import * as companyCurrencyService from '../services/company-currency.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'CompanyCurrencyConsumer' });

export default class CompanyCurrencyConsumer {
  public static async handleCreated(data: CompanyCurrencyEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle CompanyCurrency created', { data });
    try {
      const { id } = await companyCurrencyService.createOrUpdateCompanyCurrency(data);
      logger.info('CompanyCurrency[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up CompanyCurrency[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: CompanyCurrencyEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle CompanyCurrency modified', { data });
    try {
      const { id } = await companyCurrencyService.createOrUpdateCompanyCurrency(data);
      logger.info('CompanyCurrency[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save CompanyCurrency[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: CompanyCurrencyEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle CompanyCurrency deleted', { data });
    const { id } = data;
    try {
      await companyCurrencyService.deleteCompanyCurrency(id);
      logger.info('CompanyCurrency[%s] deleted successfully!', id);
    } catch (err) {
      logger.error('Failed to delete CompanyCurrency[%s]', data.id, { error: err });
      throw err;
    }
  }
}