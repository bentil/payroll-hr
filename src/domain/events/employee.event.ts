import { Department, Employee, GradeLevel, JobTitle, PayrollCompany } from '@prisma/client';

 type EmployeeAccountInfo = {
    id: number;
    employeeId: number;
    type: string;
    institutionName: string;
    institutionBranch: string;
    accountNumber: string;
    primary?: boolean ;
    secondary?: boolean ;
    active?: boolean ;
    createdAt: Date;
    modifiedAt?: Date ;
    currencyId?: number;
}

type EmployeePayInfo = {
  id: number;
  employeeId: number;
  basicPay: number;
  payPeriod: string;
  splitPayment: boolean;
  primaryPayPercent: number | null;
  primaryPaymentChannel: string;
  secondaryPaymentChannel: string | null;
  createdAt: Date;
  modifiedAt: Date | null;
  currencyId: number | null;
}

export interface EmployeeEvent extends Employee {
  employeeAccountInfo?: EmployeeAccountInfo[]
  employeePayInfo?: EmployeePayInfo | null
}

export interface EmployeeDto extends Employee {
  company?: PayrollCompany;
  jobTitle?: JobTitle;
  department?: Department;
  majorGradeLevel?: GradeLevel;
}
