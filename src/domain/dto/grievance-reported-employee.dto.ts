import {
  Employee,
  GrievanceReportedEmployee,
  GrievanceType,
  PayrollCompany
} from '@prisma/client';

export class AddGrievanceReportedEmployeeDto {
  reportedEmployeeIds!: number[];
}

export interface ReportedEmployeesDto extends GrievanceReportedEmployee {
  company?: PayrollCompany;
  reportingEmployee?: Employee;
  grievanceType?: GrievanceType;
  reportedEmployees?: Employee[];
}

export class CreateGrievanceReportedEmployeeDto {
  reportId!: number;
  reportedEmployeeIds!: number[];
}

export class CreateGrievanceReportedEmployeeRecord {
  reportId!: number;
  reportedEmployeeId!: number;

  constructor(reportId: number, reportedEmployeeId: number) {
    this.reportId = reportId;
    this.reportedEmployeeId = reportedEmployeeId;
  }
}
