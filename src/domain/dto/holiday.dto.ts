export interface CountQueryObject {
    startDate:Date;
    endDate: Date;
    includeHolidays?: boolean;
    includeWeekends?: boolean
  }