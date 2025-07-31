import { AuthorizedUser } from '../user.domain';

export interface CountQueryObject {
  startDate:Date;
  endDate: Date;
  considerPublicHolidayAsWorkday?: boolean;
  considerWeekendAsWorkday?: boolean;
  authUser: AuthorizedUser;
}

export interface CountNonWorkingDaysQueryObject {
  startDate:Date;
  endDate: Date;
  excludeHolidays?: boolean;
  excludeWeekends?: boolean;
  authUser: AuthorizedUser;
}