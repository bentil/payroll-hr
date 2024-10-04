import { DepartmentLeadershipEvent } from '../domain/events/department-leadership.event';
import * as departmentLeadershipService from '../services/department-leadership.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'DepartmentLeadershipConsumer' });

export default class DepartmentLeadershipConsumer {
  public static async handleCreated(data: DepartmentLeadershipEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle DepartmentLeadership created', { data });
    try {
      const { id } = await departmentLeadershipService.createOrUpdateDepartmentLeadership(data);
      logger.info('DepartmentLeadership[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up DepartmentLeadership[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: DepartmentLeadershipEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle DepartmentLeadership modified', { data });
    try {
      const { id } = await departmentLeadershipService.createOrUpdateDepartmentLeadership(data);
      logger.info('DepartmentLeadership[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save DepartmentLeadership[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: DepartmentLeadershipEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle DepartmentLeadership deleted', { data });
    const { id } = data;

    logger.debug('Deleting DepartmentLeadership[%s]', id);
    await departmentLeadershipService.deleteDepartmentLeadership(id);
    logger.info('DepartmentLeadership[%s] deleted successfully!', id);
  }
}