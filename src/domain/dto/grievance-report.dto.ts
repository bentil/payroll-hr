import { 
  Employee, 
  GrievanceReport, 
  GrievanceType, 
  PayrollCompany 
} from '@prisma/client';
import config from '../../config';

export class CreateGrievanceReportDto {
  companyId!: number;
  grievanceTypeId!: number;
  reportNumber!: string;
  reportingEmployeeId!: number;
  reportDate!: Date;
  note!: string;
  reportedEmployeeId?: number[];
}

export class UpdateGrievanceReportDto {
  grievanceTypeId!: number;
  reportDate!: Date;
  note!: string;
}

export interface GrievanceReportDto extends GrievanceReport {
  company?: PayrollCompany;
  reportingEmployee?: Employee;
  grievanceType?: GrievanceType;
  reportedEmployees?: Employee[];
}

export class QueryGrievanceReportDto {
  companyId?: number;
  reportingEmployeeId?: number;
  grievanceTypeId?: number;
  reportDate?: Date;
  'createdAt.gte'?: string;
  'createdAt.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceReportOrderBy = GrievanceReportOrderBy.CREATED_AT_ASC;
}

export class SearchGrievanceReportDto {
  q?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceReportOrderBy = GrievanceReportOrderBy.CREATED_AT_ASC;
}

export enum GrievanceReportOrderBy {
  REPORTNUMBER_ASC = 'reportNumber:asc',
  REPORTNUMBER_DESC = 'reportNumber:desc',
  REPORTDATE_ASC = 'reportDate:asc',
  REPORTDATE_DESC = 'reportDate:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}
