import { REIMBURESEMENT_REQUEST_STATUS } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateReimbursementRequestDto{
  employeeId!: number;
  title!: string;
  description!: string;
  currency!: number;
  amount!: Decimal;
  status!: REIMBURESEMENT_REQUEST_STATUS;
  expenditure_date!: Date;
  attachmentUrls?: string[];
}
// approver_id
// completer_id
// status_last_modified_at
// approved_at
// completed_at

export class UpdateReimbursementRequestDto{
  title?: string;
  description?: string;
  currency?: number;
  amount?: Decimal;
  expenditureDate?: Date;
}

export enum ReimbursementRequestOrderBy {
  TITLE_ASC = 'title:asc',
  TITLE_DESC = 'title:desc',
  EXPENDITURE_DATE_ASC = 'expenditureDate:asc',
  EXPENDITURE_DATE_DESC = 'expenditureDate:desc',
  APPROVED_AT_DATE_ASC = 'approvedAt:asc',
  APPROVED_AT_DATE_DESC = 'approvedAt:desc',
  COMPLETED_AT_DATE_ASC = 'completedAt:asc',
  COMPLETED_AT_DATE_DESC = 'completedAt:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}
// , , createdAt date range (createdAt.gte, createdAt.lte), approvedAt date range
// (approvedAt.gte, approvedAt.lte), completedAt date range (completedAt.gte, completedAt.lte)
// export class QueryReimbursementRequestDto {
//   employeeId?: number;
//   status?: REIMBURESEMENT_REQUEST_OPTIONS;
//   'expenditureDate.gte'?: string;
//   'expenditureDate.lte'?: string;
//   approverId?: number;
//   signerId?: 
//   'createdAt.gte'?: string;
//   'createdAt.lte'?: string;
//   page: number = 1;
//   limit: number = config.pagination.limit;
//   orderBy: GrievanceReportOrderBy = GrievanceReportOrderBy.CREATED_AT_ASC;
// }
