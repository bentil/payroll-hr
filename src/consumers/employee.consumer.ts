import { EmployeeEvent } from '../domain/events/employee.event';
import * as employeeService from '../services/employee.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'EmployeeConsumer' });

export default class EmployeeConsumer {
  public static async handleCreated(data: EmployeeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle employee created', { data });
    try {
      const { id } = await employeeService.createOrUpdateEmployee(data);
      logger.info('Employee[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up Employee[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: EmployeeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle Employee modified', { data });
    try {
      const { id } = await employeeService.createOrUpdateEmployee(data);
      logger.info('Employee[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save Employee[%s]', data.id, { error: err });
      throw err;
    }
  }

  public static async handleDeleted(data: EmployeeEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleDeleted' });
    logger.debug('Received event to handle Employee deleted', { data });
    const { id } = data;
    try {
      await employeeService.deleteEmployee(id);
      logger.info('Employee[%s] deleted successfully!', id);
    } catch (err) {
      logger.error('Failed to delete Employee[%s]', data.id, { error: err });
      throw err;
    }
  }
}