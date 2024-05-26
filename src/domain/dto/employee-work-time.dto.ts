import { Employee, EmployeeWorkTime, PayPeriod, WorkTimeUnit } from '@prisma/client';
import config from '../../config';

export class CreateEmployeeWorkTimeDto {
  employeeId!: number;
  payPeriodId!: number;
  timeUnit!: WorkTimeUnit;
  timeValue!: number;
}

export class UpdateEmployeeWorkTimeDto {
  employeeId?: number;
  payPeriodId?: number;
  timeUnit?: WorkTimeUnit;
  timeValue?: number;
}

export interface EmployeeWorkTimeDto extends EmployeeWorkTime{
  employee?: Employee,
  payPeriod?: PayPeriod
}

export enum EmployeeWorkTimeOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}


export class QueryEmployeeWorkTimeDto {
  employeeId?: number;
  payPeriodId?: number;
  timeUnit?: WorkTimeUnit;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeWorkTimeOrderBy = EmployeeWorkTimeOrderBy.CREATED_AT_DESC;
}
