import { EmployeeApprover } from '@prisma/client';
import config from '../../config';
import { EmployeeDto } from '../events/employee.event';

export class CreateEmployeeApproverDto {
  approverId!: number;
  level!: number;
}

export class UpdateEmployeeApproverDto {
  approverId?: number;
  level?: number;
}

export enum EmployeeApproverOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryEmployeeApproverDto {
  approverId?: number;
  level?: number;
  inverse?: boolean;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeApproverOrderBy = EmployeeApproverOrderBy.CREATED_AT_DESC;
}

export class GetOneEmployeeApproverDto {
  inverse?: boolean;
}

export interface EmployeeApproverDto extends EmployeeApprover {
  employee?: EmployeeDto;
  approver?: EmployeeDto;
}

export class EmployeeApproverPreflightResponseDto {
  warnings!: string[];
  errors!: string[];
}
