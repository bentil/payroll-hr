import { GradeLevelEvent } from '../domain/events/grade-level.event'; 
import * as gradeLevelService from '../services/grade-level.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'GradeLevelConsumer' });

export default class GradeLevelConsumer {
  public static async handleCreated(data: GradeLevelEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle gradeLevel created', { data });
    try {
      const { id } = await gradeLevelService.createOrUpdateGradeLevel(data);
      logger.info('GradeLevel[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up GradeLevel[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: GradeLevelEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle GradeLevel modified', { data });
    try {
      const { id } = await gradeLevelService.createOrUpdateGradeLevel(data);
      logger.info('GradeLevel[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save GradeLevel[%s]', data.id, { error: err });
      throw err;
    }
  }
}