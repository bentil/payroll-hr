import { CompanyLevelEvent } from '../domain/events/company-level.event';
import * as companyLevelService from '../services/company-level.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'CompanyLevelConsumer' });

export default class CompanyLevelConsumer {
  public static async handleCreated(data: CompanyLevelEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle companyLevel created', { data });
    try {
      const { id } = await companyLevelService.createOrUpdateCompanyLevel(data);
      logger.info('CompanyLevel[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up CompanyLevel[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: CompanyLevelEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle CompanyLevel modified', { data });
    try {
      const { id } = await companyLevelService.createOrUpdateCompanyLevel(data);
      logger.info('CompanyLevel[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save CompanyLevel[%s]', data.id, { error: err });
      throw err;
    }
  }
}