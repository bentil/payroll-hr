import { Employee, LeavePackage, LeavePlan } from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

export class CreateLeavePlanDto{
  employeeId!: number;
  leaveTypeId!: number;
  intendedStartDate!: Date;
  intendedReturnDate!: Date;
  comment!: string;
}

export class UpdateLeavePlanDto{
  leaveTypeId?: number;
  intendedStartDate?: Date;
  intendedReturnDate?: Date;
  comment?: string;
}

export enum LeavePlanOrderBy {
  INTENDED_START_DATE_ASC = 'intendedStartDate:asc',
  INTENDED_START_DATE_DESC = 'intendedStartDate:desc',
  INTENDED_RETURN_DATE_ASC = 'intendedReturnDate:asc',
  INTENDED_RETURN_DATE_DESC = 'intendedReturnDate:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryLeavePlanDto {
  employeeId?: number;
  leavePackageId?: number;
  'intendedStartDate.gte'?: string;
  'intendedStartDate.lte'?: string;
  'intendedReturnDate.gte'?: string;
  'intendedReturnDate.lte'?: string;
  queryMode?: RequestQueryMode;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeavePlanOrderBy = LeavePlanOrderBy.CREATED_AT_DESC;
}

export interface LeavePlanDto extends LeavePlan {
  employee?: Employee;
  leavePackage?: LeavePackage;
}