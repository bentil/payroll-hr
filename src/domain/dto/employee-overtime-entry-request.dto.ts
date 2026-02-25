import { 
  EmployeeOvertimeEntryRequest, 
  Overtime, 
  PayPeriod, 
  Status 
} from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';
import { EmployeeDto } from '../events/employee.event';

export class CreateEmployeeOvertimeEntryRequestDto {
  employeeId!: number;
  payPeriodId!: number;
  overtimeId!: number;
  numberOfHours!: number;
}

export class UpdateEmployeeOvertimeEntryRequestDto {
  employeeId?: number;
  payPeriodId?: number;
  overtimeId?: number;
  numberOfHours?: number;
  status?: Status;
  approverId?: number;
}

export interface EmployeeOvertimeEntryRequestDto extends EmployeeOvertimeEntryRequest{
  employee?: EmployeeDto,
  payPeriod?: PayPeriod,
  overtime?: Overtime,
}

export enum EmployeeOvertimeEntryRequestOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryEmployeeOvertimeEntryRequestDto {
  employeeId?: number;
  payPeriodId?: number;
  overtimeId?: number;
  queryMode?: RequestQueryMode;
  companyId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeOvertimeEntryRequestOrderBy = 
    EmployeeOvertimeEntryRequestOrderBy.CREATED_AT_DESC;
}

export enum EmployeeOvertimeEntryAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE'
}

export class EmployeeOvertimeEntryInputDto {
  action!: EmployeeOvertimeEntryAction;
  comment!: string;
}