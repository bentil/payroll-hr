import { EmployeeLeaveTypeSummary, LeaveType } from '@prisma/client';
import config from '../../config';
import { EmployeeDto } from '../events/employee.event';

export class CreateEmployeeLeaveTypeSummaryDto {
  employeeId!: number;
  leaveTypeId!: number;
  numberOfDaysUsed!: number;
  numberOfDaysPending!: number;
  year!: number;
  carryOverDays!: number;
  numberOfCarryOverDaysUsed?: number;
}

export class UpdateEmployeeLeaveTypeSummaryDto {
  employeeId?: number;
  leaveTypeId?: number;
  numberOfDaysUsed?: number;
  numberOfDaysPending?: number;
  year?: number;
  carryOverDays?: number;
  numberOfCarryOverDaysUsed?: number;
}

export interface EmployeeLeaveTypeSummaryDto extends EmployeeLeaveTypeSummary {
  leaveType?: LeaveType;
  employee?: EmployeeDto;
}

export class QueryEmployeeLeaveTypeSummaryDto {
  employeeId?: number;
  leaveTypeId?: number;
  year?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeLeaveTypeSummaryOrderBy = EmployeeLeaveTypeSummaryOrderBy.CREATED_AT_DESC;
}

export enum EmployeeLeaveTypeSummaryOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}