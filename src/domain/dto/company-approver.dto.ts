import { 
  ApproverType,
  CompanyApprover,
  CompanyLevel,
  PayrollCompany
} from '@prisma/client';
import config from '../../config';

export class CreateCompanyApproverDto {
  approverType!: ApproverType;
  companyLevelId?: number;
  level!: number;
}

export class UpdateCompanyApproverDto {
  approverType?: ApproverType;
  level?: number;
  companyLevelId?: number;
}

export enum CompanyApproverOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}
export class QueryCompanyApproverDto {
  approverType?: ApproverType;
  level?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: CompanyApproverOrderBy = CompanyApproverOrderBy.CREATED_AT_DESC;
}

export interface CompanyApproverDto extends CompanyApprover {
  company?: PayrollCompany;
  companyLevel?: CompanyLevel;
}
