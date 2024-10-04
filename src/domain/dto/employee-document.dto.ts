import { CompanyDocumentType, Employee, EmployeeDocument } from '@prisma/client';
import config from '../../config';

export class CreateEmployeeDocumentDto {
  employeeId!: number;
  typeId!: number;
  url!: string;
}

export class UpdateEmployeeDocumentDto {
  employeeId?: number;
  typeId?: number;
  url?: string;
}

export interface EmployeeDocumentDto extends EmployeeDocument {
  employee?: Employee;
  documentType?: CompanyDocumentType;
}

export enum EmployeeDocumentOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryEmployeeDocumentDto {
  employeeId?: number;
  typeId?: number;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: EmployeeDocumentOrderBy = EmployeeDocumentOrderBy.CREATED_AT_DESC;
}