import { CompanyLevelLeavePackage, CompanyLevel, LeavePackage } from '@prisma/client';
import config from '../../config';

export class CreateCompanyLevelLeavePackageDto {
  companyLevelId!: number;
  leavePackageIds!: number[];
}

export class CreateCompanyLevelLeavePackageRecord {
  companyLevelId!: number;
  leavePackageId!: number;

  constructor(companyLevelId: number, leavePackageId: number) {
    this.companyLevelId = companyLevelId;
    this.leavePackageId = leavePackageId;
  }
}


export interface CompanyLevelLeavePackageDto extends CompanyLevelLeavePackage {
  companyLevel?: CompanyLevel
  leavePackage?: LeavePackage
}

export class QueryCompanyLevelLeavePackageDto {
  companyLevelId?: number;
  leavePackageId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: CompanyLevelLeavePackageOrderBy =
    CompanyLevelLeavePackageOrderBy.COMPANY_LEVEL_CREATED_AT_DESC;
}


export enum CompanyLevelLeavePackageOrderBy {
  COMPANY_LEVEL_CREATED_AT_ASC = 'companyLevel.createdAt:asc',
  COMPANY_LEVEL_CREATED_AT_DESC = 'companyLevel.createdAt:desc',
  LEAVE_PACKAGE_CREATED_AT_ASC = 'leavePackage.createdAt:asc',
  LEAVE_PACKAGE_CREATED_AT_DESC = 'leavePackage.createdAt:desc'
}