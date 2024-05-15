import { OvertimeEvent } from '../domain/events/overtime.event';
import * as overtimeService from '../services/overtime.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'OvertimeConsumer' });

export default class OvertimeConsumer {
  public static async handleCreated(data: OvertimeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle Overtime created', { data });
    try {
      const { id } = await overtimeService.createOrUpdateOvertime(data);
      logger.info('Overtime[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up Overtime[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: OvertimeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle Overtime modified', { data });
    try {
      const { id } = await overtimeService.createOrUpdateOvertime(data);
      logger.info('Overtime[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save Overtime[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: OvertimeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle Overtime deleted', { data });
    const { id } = data;

    logger.debug('Deleting Overtime[%s]', id);
    await overtimeService.deleteOvertime(id);
    logger.info('Overtime[%s] deleted successfully!', id);
  }
}