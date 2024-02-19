import { 
  CompanyCurrency, 
  Employee, 
  REIMBURESEMENT_REQUEST_STATUS, 
  ReimbursementRequest, 
  ReimbursementRequestAttachment, 
  ReimbursementRequestComment
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import config from '../../config';
import { RequestQueryMode } from './leave-request.dto';

export class CreateReimbursementRequestDto{
  employeeId!: number;
  title!: string;
  description!: string;
  currencyId!: number;
  amount!: Decimal;
  expenditureDate!: Date;
  attachmentUrls?: string[];
}

export class CreateReimbursementAttachment {
  uploaderId: number;
  attachmentUrl: string;

  constructor(attachmentUrl: string, employeeId: number) {
    this.uploaderId = employeeId;
    this.attachmentUrl = attachmentUrl;
  }
}

export class CreateReimbursementAttachmentWithReqId {
  uploaderId: number;
  attachmentUrl: string;
  requestId: number;

  constructor(attachmentUrl: string, employeeId: number, requestId: number) {
    this.uploaderId = employeeId;
    this.attachmentUrl = attachmentUrl;
    this.requestId = requestId;
  }
}

export interface ReimbursementRequestDto  extends ReimbursementRequest {
  employee?: Employee;
  approver?: Employee | null;
  completer?: Employee | null;
  currency?: CompanyCurrency; 
  requestAttachments?: ReimbursementRequestAttachment[]
  requestComments?:    ReimbursementRequestComment[]
}

export class UpdateReimbursementRequestDto{
  title?: string;
  description?: string;
  currencyId?: number;
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

export class QueryReimbursementRequestDto {
  employeeId?: number;
  status?: REIMBURESEMENT_REQUEST_STATUS;
  'expenditureDate.gte'?: string;
  'expenditureDate.lte'?: string;
  approverId?: number;
  completerId?: number;
  queryMode?: RequestQueryMode;
  'createdAt.gte'?: string;
  'createdAt.lte'?: string;
  'approvedAt.gte'?: string;
  'approvedAt.lte'?: string;
  'completedAt.gte'?: string;
  'completedAt.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: ReimbursementRequestOrderBy = ReimbursementRequestOrderBy.CREATED_AT_ASC;
}

export enum ReimbursementResponseAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  QUERY = 'QUERY'
}

export class ReimbursementResponseInputDto {
  action!: ReimbursementResponseAction;
  comment?: string;
  attachmentUrls?: string[];
}

export class ReimbursementRequestUpdatesDto {
  comment?: string;
  attachmentUrls?: string[];
}

export class CompleteReimbursementRequestDto {
  comment?: string;
}