import { 
  Employee,
  LEAVE_REQUEST_STATUS, 
  LeavePackage, 
  LeaveRequest 
} from '@prisma/client';
import config from '../../config';

export class CreateLeaveRequestDto {
  employeeId!: number;
  leaveTypeId!: number;
  startDate!: Date;
  returnDate!: Date;
  comment!: string;
}

export class UpdateLeaveRequestDto {
  leaveTypeId?: number;
  startDate?: Date;
  returnDate?: Date;
  comment?: string;
}

export enum LeaveRequestOrderBy {
  START_DATE_ASC = 'startDate:asc',
  START_DATE_DESC = 'startDate:desc',
  RETURN_DATE_ASC = 'returnDate:asc',
  RETURN_DATE_DESC = 'returnDate:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export enum RequestQueryMode {
  SELF,
  SUPERVISEES,
  ALL
}
export class QueryLeaveRequestDto {
  employeeId?: number;
  leavePackageId?: number;
  queryMode?: RequestQueryMode;
  status?: LEAVE_REQUEST_STATUS;
  'startDate.gte'?: string;
  'startDate.lte'?: string;
  'returnDate.gte'?: string;
  'returnDate.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_DESC;
}

export enum LeaveResponseAction {
  APPROVE,
  DECLINE
}

export class LeaveResponseInputDto {
  action!: LeaveResponseAction;
  comment!: string;
}

export interface LeaveRequestDto extends LeaveRequest {
	employee?: Employee,
	leavePackage?: LeavePackage
}

export enum AdjustmentOptions {
  INCREASE,
  DECREASE
}

export class AdjustDaysDto {
  adjustment!: AdjustmentOptions;
  count!: number;
  comment!: string;
}
