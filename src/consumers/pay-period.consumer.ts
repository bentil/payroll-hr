import { PayPeriodEvent } from '../domain/events/pay-period.event';
import * as payPeriodService from '../services/pay-period.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'PayPeriodConsumer' });

export default class PayPeriodConsumer {
  public static async handleCreated(data: PayPeriodEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle PayPeriod created', { data });
    try {
      const { id } = await payPeriodService.createOrUpdatePayPeriod(data);
      logger.info('PayPeriod[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up PayPeriod[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: PayPeriodEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle PayPeriod modified', { data });
    try {
      const { id } = await payPeriodService.createOrUpdatePayPeriod(data);
      logger.info('PayPeriod[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save PayPeriod[%s]', data.id, { error: err });
      throw err;
    }
  }
}