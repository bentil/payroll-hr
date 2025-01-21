import { 
  DisciplinaryAction, 
  DisciplinaryActionType, 
  Employee, 
  GrievanceReport, 
  PayrollCompany 
} from '@prisma/client';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

export class CreateDisciplinaryActionDto {
  companyId!: number;
  employeeId!: number;
  actionTypeId!: number;
  actionNumber!: string;
  grievanceReportId?: number;
  notes!: string;
  actionDate!: Date;
  actionEndDate?: Date;
  private?: boolean;
}

export class UpdateDisciplinaryActionDto {
  actionTypeId?: number;
  grievanceReportId?: number;
  notes?: string;
  actionDate?: Date;
  private?: boolean;
}

export interface DisciplinaryActionDto extends DisciplinaryAction{
  actionType?: DisciplinaryActionType;
  grievanceReport?: GrievanceReport;
  company?: PayrollCompany,
  employee?: Employee
}

export enum DisciplinaryActionOrderBy {
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
  ACTION_NUMBER_ASC = 'actionNumber:asc',
  ACTION_NUMBER_DESC = 'actionNumber:desc',
  ACTION_DATE_ASC = 'actionDate:asc',
  ACTION_DATE_DESC = 'actionDate:desc',
}

export class QueryDisciplinaryActionDto {
  companyId?: number;
  employeeId?: number;
  actionTypeId?: number;
  grievanceReportId?: number;
  'actionDate.gte'?: string;
  'actionDate.lte'?: string;
  queryMode?: RequestQueryMode;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: DisciplinaryActionOrderBy = DisciplinaryActionOrderBy.CREATED_AT_DESC;
}

export class SearchDisciplinaryActionDto {
  q?: string;
  page = 1;
  limit: number = config.pagination.limit;
  orderBy: DisciplinaryActionOrderBy = DisciplinaryActionOrderBy.CREATED_AT_DESC;
}