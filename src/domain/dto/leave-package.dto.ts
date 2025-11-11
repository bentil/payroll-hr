import { CompanyLevelLeavePackage, CompanyLevel, LeavePackage, LeaveType } from '@prisma/client';
import config from '../../config';

export class CreateLeavePackageDto {
  companyId!: number;
  code!: string;
  name!: string;
  description?: string;
  leaveTypeId!: number;
  maxDays!: number;
  paid?: boolean;
  redeemable?: boolean;
  accrued?: boolean;
  carryOverDaysValue?: number;
  carryOverDaysPercent?: number;
  companyLevelIds?: number[];
}

export class UpdateLeavePackageDto {
  code?: string;
  name?: string;
  description?: string;
  leaveTypeId?: number;
  maxDays?: number;
  paid?: boolean;
  redeemable?: boolean;
  accrued?: boolean;
  carryOverDaysValue?: number;
  carryOverDaysPercent?: number;
  addCompanyLevelIds?: number[];
  removeCompanyLevelIds?: number[];
}


export class CreateCompanyLevelLeavePackageDto {
  companyLevelId!: number;
  leavePackageId!: number;

  constructor(companyLevelId: number, leavePackageId: number) {
    this.companyLevelId = companyLevelId;
    this.leavePackageId = leavePackageId;
  }
}
export interface LeavePackageDto extends LeavePackage {
  leaveType?: LeaveType
  companyLevelLeavePackages?: CompanyLevelLeavePackageDto[]
}

export interface CompanyLevelLeavePackageDto extends CompanyLevelLeavePackage {
  companyLevel?: CompanyLevel
}


export class QueryLeavePackageDto {
  companyId?: number;
  code?: string;
  leaveTypeId?: number;
  paid?: boolean;
  redeemable?: boolean;
  accrued?: boolean;
  includeCompanyLevels?: boolean;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeavePackageOrderBy = LeavePackageOrderBy.CREATED_AT_DESC;
}

export class SearchLeavePackageDto {
  q?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeavePackageOrderBy = LeavePackageOrderBy.CREATED_AT_DESC;
}

export enum LeavePackageOrderBy {
  CODE_ASC = 'code:asc',
  CODE_DESC = 'code:desc',
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}