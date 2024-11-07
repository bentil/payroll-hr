import { JobTitleEvent } from '../domain/events/job-title.event'; 
import * as jobTitleService from '../services/job-title.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'JobTitleConsumer' });

export default class JobTitleConsumer {
  public static async handleCreated(data: JobTitleEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle jobTitle created', { data });
    try {
      const { id } = await jobTitleService.createOrUpdateJobTitle(data);
      logger.info('JobTitle[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up JobTitle[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: JobTitleEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle jobTitle modified', { data });
    try {
      const { id } = await jobTitleService.createOrUpdateJobTitle(data);
      logger.info('JobTitle[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save jobTitle[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: JobTitleEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle JobTitlle deleted', { data });
    const { id } = data;
    try {
      await jobTitleService.deleteJobTitle(id);
      logger.info('JobTitle[%s] deleted successfully!', id);
    } catch (err) {
      logger.error('Failed to delete JobTitle[%s]', data.id, { error: err });
      throw err;
    }
  }
}