import { CompanyTreeNode, Employee, JobTitle } from '@prisma/client';
import config from '../../config';

export class CreateCompanyTreeNodeDto {
  parentId?: number;
  jobTitleId!: number;
  employeeId?: number;
  childNodes?: childNode[];
}

export class childNode {
  jobTitleId!: number;
  employeeId?: number;
}

export class CreateChildNodeDto {
  jobTitleId!: number;
  employeeId?: number;
  parentId!: number;
  companyId!: number;

  constructor(childNode: childNode, companyId: number, parentId: number) {
    this.jobTitleId = childNode.jobTitleId;
    this.employeeId = childNode.employeeId;
    this.companyId = companyId;
    this.parentId = parentId;
  }
}

export class UpdateCompanyTreeNodeDto {
  parentId?: number;
  employeeId?: number;
}

export enum CompanyTreeNodeOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc'
}

export class QueryCompanyTeeNodeDto {
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: CompanyTreeNodeOrderBy = CompanyTreeNodeOrderBy.CREATED_AT_DESC;
}

export interface CompanyTreeNodeDto extends CompanyTreeNode {
  jobTitle?: JobTitle;
  employee?: Employee
}