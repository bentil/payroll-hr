import config from '../../config';

export class CreateGrievanceTypeDto {
  companyId!: number;
  code!: string;
  name!: string;
  description!: string;
}

export class UpdateGrievanceTypeDto {
  companyId?: number;
  code?: string;
  name?: string;
  description?: string;
}

export enum GrievanceTypeOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  CODE_ASC = 'code:asc',
  CODE_DESC = 'code:desc',
}

export class QueryGrievanceTypeDto {
  companyId?: number;
  code?: string;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceTypeOrderBy = GrievanceTypeOrderBy.CREATED_AT_DESC;
}

export class SearchGrievanceTypeDto {
  q?: string;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceTypeOrderBy = GrievanceTypeOrderBy.CREATED_AT_DESC;
}