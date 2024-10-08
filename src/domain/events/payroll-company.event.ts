import { AuthorizedUser } from '../user.domain';

export interface PayrollCompanyMessage {
  id: number;
  organizationId: string;
  countryId: number | null;
  currencyId: number;
  name: string;
  address: string;
  logoUrl: string | null;
  contactEmail: string;
  contactMsisdn?: string | null;
  status: string;
  allowNegativeRates?: boolean;
  considerPublicHolidayAsWorkday?: boolean; 
  considerWeekendAsWorkday?: boolean;
  enableEmployeeLogin: boolean
  workHoursInADay: number
  leaveRequestApprovalsRequired: number
  reimbursementRequestApprovalsRequired: number
}

export interface PayrollCompanyCreatedEvent extends PayrollCompanyMessage {
  user: AuthorizedUser;
}

export interface PayrollCompanyModifiedEvent extends PayrollCompanyMessage {}