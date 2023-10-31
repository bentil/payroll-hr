import { 
  PayrollCompanyCreatedEvent, 
  PayrollCompanyModifiedEvent 
} from '../domain/events/payroll-company.event';
import * as payrollCompService from '../services/payroll-company.service';
import { rootLogger } from '../utils/logger';

const _logger = rootLogger.child({ context: 'PayrollCompanyCosumer' });

export default class PayrollCompanyConsumer {
  public static async handleCreated(data: PayrollCompanyCreatedEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleCreated' });
    logger.debug('Received event to handle PayrollCompany created', { data });
    try {
      const { id } = await payrollCompService.createOrUpdatePayrollCompany(data);
      logger.info('PayrollCompany[%s] saved successfully!', id);
    } catch (err) {
      logger.error(
        'Failed to set up PayrollCompany[%s]',
        data.id, { error: err }
      );
      throw err;
    }
  }

  public static async handleModified(data: PayrollCompanyModifiedEvent): Promise<void> {
    const logger = _logger.child({ method: 'handleModified' });
    logger.debug('Received event to handle PayrollCompany modified', { data });
    try {
      const { id } = await payrollCompService.createOrUpdatePayrollCompany(data);
      logger.info('PayrollCompany[%s] saved successfully!', id);
    } catch (err) {
      logger.error('Failed to save PayrollCompany[%s]', data.id, { error: err });
      throw err;
    }
  }
}