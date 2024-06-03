import config from '../../config';

export class CreateCompanyDocumentTypeDto {
  companyId!: number;
  description!: string;
  name!: string;
}

export class UpdateCompanyDocumentTypeDto {
  description?: string;
  name?: string;
}

export enum CompanyDocumentTypeOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
}

export class QueryCompanyDocumentTypeDto {
  companyId!: number;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: CompanyDocumentTypeOrderBy = CompanyDocumentTypeOrderBy.CREATED_AT_DESC;
}

export class SearchCompanyDocumentTypeDto {
  q?: string;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: CompanyDocumentTypeOrderBy = CompanyDocumentTypeOrderBy.CREATED_AT_DESC;
}