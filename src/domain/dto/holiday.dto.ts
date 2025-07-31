export interface CountQueryObject {
  startDate:Date;
  endDate: Date;
  considerPublicHolidayAsWorkday?: boolean;
  considerWeekendAsWorkday?: boolean;
  organizationId: string;
}

export interface CountNonWorkingDaysQueryObject {
  startDate:Date;
  endDate: Date;
  excludeHolidays?: boolean;
  excludeWeekends?: boolean;
  organizationId: string;
}