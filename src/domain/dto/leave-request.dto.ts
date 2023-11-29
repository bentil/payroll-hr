import { 
  Employee,
  LEAVE_REQUEST_STATUS, 
  LeavePackage, 
  LeaveRequest 
} from '@prisma/client';
import config from '../../config';

export class CreateLeaveRequestDto{
  employeeId!: number;
  leaveTypeId!: number;
  startDate!: Date;
  returnDate!: Date;
  comment!: string;
  status!: LEAVE_REQUEST_STATUS;
}

export class UpdateLeaveRequestDto{
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

export class QueryLeaveRequestDto {
  employeeId?: number;
  leavePackageId?: number;
  status?: LEAVE_REQUEST_STATUS;
  'startDate.gte'?: string;
  'startDate.lte'?: string;
  'returnDate.gte'?: string;
  'returnDate.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_ASC;
}

export const LEAVE_RESPONSE_ACTION = {
  APPROVE: 'APPROVE',
  DECLINE: 'DECLINE'
};

type LEAVE_RESPONSE_ACTION = 
  (typeof LEAVE_RESPONSE_ACTION)[keyof typeof LEAVE_RESPONSE_ACTION];


export class ResponseObjectDto {
  action!: LEAVE_RESPONSE_ACTION;
  comment!: string;
}

export interface LeaveRequestDto extends LeaveRequest {
	employee?: Employee,
	leavePackage?: LeavePackage
}