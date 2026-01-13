import { 
  LEAVE_REQUEST_STATUS, 
  LeaveRequest, 
  LeaveResponse
} from '@prisma/client';
import config from '../../config';
import { LeavePackageDto } from './leave-package.dto';
import { EmployeeDto } from '../events/employee.event';

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
  SELF = 'SELF',
  SUPERVISEES = 'SUPERVISEES',
  ALL = 'ALL'
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
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE'
}

export class LeaveResponseInputDto {
  action!: LeaveResponseAction;
  comment!: string;
}

export interface LeaveRequestDto extends LeaveRequest {
	employee?: EmployeeDto;
	leavePackage?: LeavePackageDto;
  leaveResponses?: LeaveResponse[];
  cancelledByEmployee?: EmployeeDto | null;
}

export enum AdjustmentOptions {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE'
}

export class AdjustDaysDto {
  adjustment!: AdjustmentOptions;
  count!: number;
  comment!: string;
}

export class ConvertLeavePlanToRequestDto {
  leavePlanId!: number;
}

export class UploadLeaveRequestViaSpreadsheetDto {
  rowNumber?: number;
  companyId!: number;
  employeeNumber!: string;
  leaveTypeCode!: string;
  startDate!: Date;
  returnDate!: Date;
  comment?: string;
  notifyApprovers!: 'Yes' | 'No';
}

export class UploadLeaveRequestCheckedRecords {
  employeeId!: number;
  leavePackageId!: number;
  numberOfDays!: number;
  approvalsRequired!: number;
  leaveTypeName?: string;
  notifyApprovers?: boolean;
}

export class UploadLeaveRequestResponse {
  successful!: {
    leaveRequestId?: number;
    rowNumber?: number;
    approversNotified?: boolean;
  }[];
  failed!: {
    rowNumber?: number;
    errors: {
      column: string;
      reason: string;
    }[]
  }[];
}

export class FilterLeaveRequestForExportDto {
  employeeId?: number;
  leavePackageId?: number;
  queryMode?: RequestQueryMode;
  status?: LEAVE_REQUEST_STATUS;
  'startDate.gte'?: string;
  'startDate.lte'?: string;
  'returnDate.gte'?: string;
  'returnDate.lte'?: string;
  'createdAt.gte'?: string;
  'createdAt.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_DESC;
}
export class QueryLeaveRequestForReportDto {
  'startDate.gte'?: string;
  'startDate.lte'?: string;
  'returnDate.gte'?: string;
  'returnDate.lte'?: string;
  'createdAt.gte'?: string;
  'createdAt.lte'?: string;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_DESC;
}

export type numberOfDaysObject = {
  numberOfDaysUsed: number;
  numberOfDaysNotUsed: number;
}

export class LeaveTakenReportObject {
  leaveType!: {
    id: number,
    code?: string,
    name?: string,
  };
  department!:LeaveTakenReportDepartmentObject[];
  numberOfDaysPerCompany!: numberOfDaysObject;
}

export class LeaveTakenReportDepartmentObject {
  id?: number;
  code?: string;
  name?: string;
  employees!: LeaveTakenReportEmployeeObject[];
  numberOfDaysPerDepartment!: numberOfDaysObject;
}

export class LeaveTakenReportEmployeeObject {
  id!: number;
  employeeNumber!: string;
  name!: string;
  numberOfDays!: numberOfDaysObject;
}

export class LeaveTakenWithPackageReportObject {
  id!: number;
  code?: string;
  name?: string;
  leavePackages!: EmployeeLeavePackageObject[];
}

export class EmployeeLeaveTakenReportObject {
  leaveType!: LeaveTakenWithPackageReportObject[];
  employee!: Omit <LeaveTakenReportEmployeeObject, 'numberOfDays'>;
}

export class EmployeeLeavePackageObject {
  id!: number;
  name!: string;
  code!: string;
  daysUsed!: number;
  daysApprovedButNotUsed!: number;
  daysPendingApproval!: number;
  daysAvailable!: number;
}

export class LeaveBalanceReportObject {
  employee!: {
    id: number;
    employeeNumber: string;
    name: string;
  };
  leaveTypes!: LeaveBalanceReportLeaveTypeObject[];
}

export class LeaveBalanceReportLeaveTypeObject {
  id!: number;
  code?: string;
  name?: string;
  leavePackages!: LeaveBalanceReportLeavePackageObject[];
}

export class LeaveBalanceReportLeavePackageObject {
  id!: number;
  code?: string;
  name?: string;
  remainingLeaveDays!: number;
}

export class ExportLeaveRequestQueryDto {
  employeeNumber?: boolean;
  leaveTypeCode?: boolean;
  startDate?: boolean;
  returnDate?: boolean;
  comment?: boolean;
  status?: boolean;
  cancelledByEmployeeNumber?: boolean;
  approvalsRequired?: boolean;
  numberOfDays?: boolean;
  queryMode?: RequestQueryMode;
  orderBy: LeaveRequestOrderBy = LeaveRequestOrderBy.CREATED_AT_DESC;
}