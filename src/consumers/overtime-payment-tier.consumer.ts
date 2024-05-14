import { OvertimePaymentTierEvent } from '../domain/events/overtime-payment-tier.event';
import * as overtimePaymentTierService from '../services/overtime-payment-tier.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'OvertimePaymentTierConsumer' });

export default class OvertimePaymentTierConsumer {
  public static async handleCreated(data: OvertimePaymentTierEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle OvertimePaymentTier created', { data });
    try {
      const { id } = await overtimePaymentTierService.createOrUpdateOvertimePaymentTier(data);
      logger.info('OvertimePaymentTier[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up OvertimePaymentTier[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: OvertimePaymentTierEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle OvertimePaymentTier modified', { data });
    try {
      const { id } = await overtimePaymentTierService.createOrUpdateOvertimePaymentTier(data);
      logger.info('OvertimePaymentTier[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save OvertimePaymentTier[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: OvertimePaymentTierEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle OvertimePaymentTier deleted', { data });
    const { id } = data;

    logger.debug('Deleting OvertimePaymentTier[%s]', id);
    await overtimePaymentTierService.deleteOvertimePaymentTier(id);
    logger.info('OvertimePaymentTier[%s] deleted successfully!', id);
  }
}