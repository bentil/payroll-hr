import { CompanyLevelLeavePackage, LeavePackage } from '@prisma/client';

export type CompanyLevel = {
  id: number;
  organizationId: string;
  companyId: number | null;
  levelNumber: number;
  levelName: string;
  juniorLevel: boolean;
  parentId: number | null;
  childId: number | null;
  createdAt: Date;
  modifiedAt: Date | null;
}

export interface CompanyLevelLeavePackageDto extends CompanyLevelLeavePackage {
  leavePackages?: LeavePackage
}

export interface CompanyLevelEvent extends CompanyLevel {
  companyLevelLeavePackages?: CompanyLevelLeavePackageDto[]
}