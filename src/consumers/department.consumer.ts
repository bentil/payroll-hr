import { DepartmentEvent } from '../domain/events/department.event';
import * as departmentService from '../services/department.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'DepartmentConsumer' });

export default class DepartmentConsumer {
  public static async handleCreated(data: DepartmentEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle Department created', { data });
    try {
      const { id } = await departmentService.createOrUpdateDepartment(data);
      logger.info('Department[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up Department[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: DepartmentEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle Department modified', { data });
    try {
      const { id } = await departmentService.createOrUpdateDepartment(data);
      logger.info('Department[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save Department[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: DepartmentEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle Department deleted', { data });
    const { id } = data;

    logger.debug('Deleting Department[%s]', id);
    await departmentService.deleteDepartment(id);
    logger.info('Department[%s] deleted successfully!', id);
  }
}