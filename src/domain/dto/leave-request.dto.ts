import { 
  Employee,
  LEAVE_REQUEST_OPTIONS, 
  LEAVE_RESPONSE_OPTIONS, 
  LeavePackage, 
  LeaveRequest 
} from '@prisma/client';
import config from '../../config';

export class CreateLeaveRequestDto{
  employeeId!: number;
  leavePackageId!: number;
  startDate!: Date;
  returnDate!: Date;
  comment!: string;
  status!: LEAVE_REQUEST_OPTIONS;
}

export class UpdateLeaveRequestDto{
  leavePackageId?: number;
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

export class QueryLeaveRequestDto {
  employeeId?: number;
  leavePackageId?: number;
  status?: LEAVE_REQUEST_OPTIONS;
  'startDate.gte'?: string;
  'startDate.lte'?: string;
  'returnDate.gte'?: string;
  'returnDate.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_ASC;
}

export class CreateLeaveResponseDto {
  status!: LEAVE_REQUEST_OPTIONS;
  responseCompletedAt!: Date;
  leaveRequestId!: number;
  approvingEmployeeId!: number;
  responseType!: LEAVE_RESPONSE_OPTIONS;
  comment!: string;
}

export class ResponseObjectDto {
  action!: LEAVE_RESPONSE_OPTIONS;
  comment!: string;
}

export class CancelLeaveRequestDto {
  status!: LEAVE_REQUEST_OPTIONS;
  cancelledByEmployeeId!: number;
  cancelledAt!: Date;
}

export interface LeaveRequestDto extends LeaveRequest {
	employee?: Employee,
	leavePackage?: LeavePackage
}