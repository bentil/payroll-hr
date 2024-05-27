import { Employee, EmployeeOvertimeEntry, Overtime, PayPeriod } from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

export class CreateEmployeeOvertimeEntryDto {
  employeeId!: number;
  payPeriodId!: number;
  overtimeId!: number;
  numberOfHours!: number;
}

export class UpdateEmployeeOvertimeEntryDto {
  employeeId?: number;
  payPeriodId?: number;
  overtimeId?: number;
  numberOfHours?: number;
}

export interface EmployeeOvertimeEntryDto extends EmployeeOvertimeEntry{
  employee?: Employee,
  payPeriod?: PayPeriod,
  overtime?: Overtime,
}

export enum EmployeeOvertimeEntryOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryEmployeeOvertimeEntryDto {
  employeeId?: number;
  payPeriodId?: number;
  overtimeId?: number;
  queryMode?: RequestQueryMode;
  companyId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeOvertimeEntryOrderBy = EmployeeOvertimeEntryOrderBy.CREATED_AT_DESC;
}
