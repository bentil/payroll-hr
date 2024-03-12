import { CompanyTreeNode, Employee, JobTitle } from '@prisma/client';
import config from '../../config';

export class CreateCompanyTreeNodeDto {
  parentId?: number;
  jobTitleId!: number;
  employeeId?: number;
  childNodes?: ChildNode[];
}

export class ChildNode {
  jobTitleId!: number;
  employeeId?: number;
}

export class CreateChildNodeDto {
  jobTitleId!: number;
  employeeId?: number;
  companyId!: number;

  constructor(childNode: ChildNode, companyId: number) {
    this.jobTitleId = childNode.jobTitleId;
    this.employeeId = childNode.employeeId;
    this.companyId = companyId;
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

export class DeleteCompanyTreeNodeQueryDto {
  successorParentId?: number;
}

export interface CompanyTreeNodeDto extends CompanyTreeNode {
  jobTitle?: JobTitle;
  employee?: Employee
  parent?: CompanyTreeNodeDto;
  children?: CompanyTreeNodeDto[]
}

export class includeRelations {
  include?: {
    employee?: boolean;
    company?: boolean;
    jobTitle?: boolean;
    parent?: boolean;
    children?: boolean | any ;
  };
}

export class CheckIfSupervisorDto {
  employeeId?: number;
}