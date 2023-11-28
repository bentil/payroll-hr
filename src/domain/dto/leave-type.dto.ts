import { LeaveType } from '@prisma/client';
import config from '../../config';

export class CreateLeaveTypeDto {
  code!: string;
  name!: string;
  colorCode!: string;
  description!: string;
}

export class UpdateLeaveTypeDto {
  code?: string;
  name?: string;
  colorCode?: string;
  description?: string;
}

export interface LeaveTypeDto extends LeaveType { }

export class QueryLeaveTypeDto {
  code?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveTypeOrderBy = LeaveTypeOrderBy.CREATED_AT_ASC;
}


export class QueryApplicableLeaveTypeDto {
  employeeId?:number;
  companyLevelId?: number;
  
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: ApplicableLeaveTypeOrderBy = ApplicableLeaveTypeOrderBy.CREATED_AT_ASC;
}

export class SearchLeaveTypeDto {
  q?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveTypeOrderBy = LeaveTypeOrderBy.CREATED_AT_ASC;
}

export class IncludeCompanyLevelsQueryDto {
  includeCompanyLevels?: boolean;
}

export enum LeaveTypeOrderBy {
  CODE_ASC = 'code:asc',
  CODE_DESC = 'code:desc',
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export enum ApplicableLeaveTypeOrderBy {
  CODE_ASC = 'code:asc',
  CODE_DESC = 'code:desc',
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
}