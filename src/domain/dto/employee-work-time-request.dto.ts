import { EmployeeWorkTimeRequest, PayPeriod, Status, WorkTimeUnit } from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';
import { EmployeeDto } from '../events/employee.event';

export class CreateEmployeeWorkTimeRequestDto {
  employeeId!: number;
  payPeriodId!: number;
  timeUnit!: WorkTimeUnit;
  timeValue!: number;
}

export class UpdateEmployeeWorkTimeRequestDto {
  employeeId?: number;
  payPeriodId?: number;
  timeUnit?: WorkTimeUnit;
  timeValue?: number;
  status?: Status;
  approverId?: number;
}

export interface EmployeeWorkTimeRequestDto extends EmployeeWorkTimeRequest{
  employee?: EmployeeDto,
  payPeriod?: PayPeriod
}

export enum EmployeeWorkTimeRequestOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}


export class QueryEmployeeWorkTimeRequestDto {
  employeeId?: number;
  payPeriodId?: number;
  timeUnit?: WorkTimeUnit;
  queryMode?: RequestQueryMode;
  companyId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeWorkTimeRequestOrderBy = EmployeeWorkTimeRequestOrderBy.CREATED_AT_DESC;
}

export enum EmployeeWorkTimeAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE'
}

export class EmployeeWorkTimeInputDto {
  action!: EmployeeWorkTimeAction;
  comment!: string;
}