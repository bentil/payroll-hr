import { 
  Employee, 
  GrievanceReport, 
  GrievanceType, 
  PayrollCompany 
} from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

export class CreateGrievanceReportDto {
  companyId!: number;
  grievanceTypeId!: number;
  reportNumber!: string;
  reportingEmployeeId!: number;
  reportDate!: Date;
  note!: string;
  reportedEmployeeId?: number[];
  private?: boolean;
}

export class UpdateGrievanceReportDto {
  grievanceTypeId?: number;
  reportDate?: Date;
  note?: string;
  private?: boolean;
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
  reportedEmployeeId?: number[];
  'createdAt.gte'?: string;
  'createdAt.lte'?: string;
  queryMode?: RequestQueryMode;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceReportOrderBy = GrievanceReportOrderBy.CREATED_AT_DESC;
}

export class SearchGrievanceReportDto {
  q?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: GrievanceReportOrderBy = GrievanceReportOrderBy.CREATED_AT_DESC;
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
