import { HolidayEvent } from '../domain/events/holiday.event'; 
import * as holidayService from '../services/holiday.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'HolidayConsumer' });

export default class HolidayConsumer {
  public static async handleCreated(data: HolidayEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle holiday created', { data });
    try {
      const { id } = await holidayService.createOrUpdateHoliday(data);
      logger.info('holiday[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up holiday[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: HolidayEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle holiday modified', { data });
    try {
      const { id } = await holidayService.createOrUpdateHoliday(data);
      logger.info('holiday[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save holiday[%s]', data.id, { error: err });
      throw err;
    }
  }
}