import { PayrollCompany, Prisma } from '@prisma/client';
import * as repository from '../repositories/payroll-company.repository';
import { rootLogger } from '../utils/logger';
import { PayrollCompanyMessage } from '../domain/events/payroll-company.event';
import { InputError, InvalidStateError, NotFoundError, ServerError } from '../errors/http-errors';
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
    considerPublicHolidayAsWorkday: data.considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday: data.considerWeekendAsWorkday,
    enableEmployeeLogin: data.enableEmployeeLogin,
    workHoursInADay: data.workHoursInADay,
    leaveRequestApprovalsRequired: data.leaveRequestApprovalsRequired,
    reimbursementRequestApprovalsRequired: data.reimbursementRequestApprovalsRequired,
    notifyApproversOnRequestResponse: data.notifyApproversOnRequestResponse,
    notifyHrOnLeaveRequest: data.notifyHrOnLeaveRequest,
    notifyHrOnReimbursementRequest: data.notifyHrOnReimbursementRequest,
    notifyHrOnEmployeeOvertimeEntryRequest: data.notifyHrOnEmployeeOvertimeEntryRequest,
    notifyHrOnEmployeeWorkTimeRequest: data.notifyHrOnEmployeeWorkTimeRequest
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

export async function validatePayrollCompany(
  id: number,
  options?: {
    throwOnNotActive?: boolean,
    organizationId?: string
  }
): Promise<PayrollCompany> {
  logger.info('Getting details for Company[%s]', id);
  let payrollCompany: PayrollCompany | null;
  try {
    payrollCompany = await repository.findFirst({
      id,
      organizationId: options?.organizationId
    });
  } catch (err) {
    logger.warn('Getting PayrollCompany[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!payrollCompany) {
    logger.warn('PayrollCompany[%s] does not exist', id);
    if (options?.organizationId) {
      throw new NotFoundError({
        message: 'Payroll company does not exist for your organization'
      });
    }
    throw new NotFoundError({ message: 'Payroll company does not exist' });
  }

  if (options?.throwOnNotActive) {
    if (payrollCompany.status !== 'ACTIVE') {
      throw new InvalidStateError({
        name: errors.PAYROLL_COMPANY_NOT_ACTIVE,
        message: 'Payroll company is not active'
      });
    }
  }

  logger.info('PayrollCompany[%s] details retrieved!', id);
  return payrollCompany;
}


export function checkIfNegativeRateAllowedForCompany(options: {
  allowNegativeRates: boolean,
  value: Prisma.Decimal | Prisma.Decimal[]
}) {
  const { allowNegativeRates, value } = options;
  const hasNegativeRate = Array.isArray(value)
    ? value.some(val => val.isNegative())
    : value.isNegative();

  if (hasNegativeRate && !allowNegativeRates) {
    throw new InputError({
      name: errors.NEGATIVE_RATE_NOT_ALLOWED,
      message: 'Negative rate values not allowed for company'
    });
  }
}

export async function deletePayrollCompany(id: number): Promise<void> {
  const payrollCompany = await repository.findOne({ id });
  if (!payrollCompany) {
    logger.warn('PayrollCompany[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.PAYROLL_COMPANY_NOT_FOUND,
      message: 'Payroll company to delete does not exisit'
    });
  }

  logger.debug('Deleting PayrollCompany[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('PayrollCompany[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting PayrollCompany[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}