import { PayrollCompany } from '@prisma/client';
import * as repository from '../repositories/payroll-company.repository';
import { rootLogger } from '../utils/logger';
import { PayrollCompanyMessage } from '../domain/events/payroll-company.event';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { errors } from '../utils/constants';

const logger = rootLogger.child({ context: 'PayrollCompanyService' });

export async function createOrUpdatePayrollCompany(
  data: Omit<PayrollCompanyMessage, 'createdAt' | 'modifiedAt'>
): Promise<PayrollCompany> {
  logger.debug(
    'Saving PayrollCompany[%s] for Organization[%s]',
    data.id, data.organizationId
  );
  const company = await repository.createOrUpdate({
    id: data.id,
    organizationId: data.organizationId,
    name: data.name,
    address: data.address,
    logoUrl: data.logoUrl,
    contactEmail: data.contactEmail,
    contactMsisdn: data.contactMsisdn,
    countryId: data.countryId,
    currencyId: data.currencyId,
    status: data.status,
    allowNegativeRates: data.allowNegativeRates,
  });
  logger.info(
    'PayrollCompany[%s] saved for Organization[%s]',
    data.id, data.organizationId
  );

  return company;
}

export async function getPayrollCompany(id: number): Promise<PayrollCompany> {
  logger.debug('Getting details for PayrollCompany[%s]', id);
  let payrollCompany: PayrollCompany | null;

  try {
    payrollCompany = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting PayrollCompany[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  if (!payrollCompany) {
    throw new NotFoundError({
      name: errors.PAYROLL_COMPANY_NOT_FOUND,
      message: 'Payroll company with this ID does not exist'
    });
  }

  logger.info('PayrollCompany[%s] details retreived!', id);
  return payrollCompany;
}
