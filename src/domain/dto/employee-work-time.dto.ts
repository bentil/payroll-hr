import { Employee, EmployeeWorkTime, PayPeriod, WorkTimeUnit } from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

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
  queryMode?: RequestQueryMode;
  companyId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeWorkTimeOrderBy = EmployeeWorkTimeOrderBy.CREATED_AT_DESC;
}

export class UploadEmployeeWorkTimeViaSpreadsheetDto {
  rowNumber?: number;
  employeeNumber!: string;
  payPeriodCode!: string;
  timeUnit!: WorkTimeUnit;
  timeValue!: number;
}

export class UploadEmployeeWorkTimeCheckedRecords {
  employeeId!: number;
  payPeriodId!: number;
}

export class UploadEmployeeWorkTimeResponse {
  successful!: {
    employeeWorkTimeId?: number;
    rowNumber?: number;
  }[];
  failed!: {
    rowNumber?: number;
    errors: {
      column: string;
      reason: string;
    }[]
  }[];
}