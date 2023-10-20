export type Employee = {
    id: number
    companyId: number
    notchId?: number
    employeeNumber: string
    title: string
    firstName: string
    lastName: string
    otherNames?: string
    gender: string
    dateOfBirth: Date
    photoUrl?: string
    ssn: string
    taxIdentificationNumber?: string
    majorGradeLevelId?: number
    minorGradeLevelId?: number
    nationality: string
    regionId?: number
    tribeId?: number
    email?: string
    privateEmail?: string
    msisdn?: string 
    alternateMsisdn?: string 
    address?: string 
    digitalAddress?: string 
    jobTitleId?: number 
    departmentId?: number 
    divisionId?: number 
    stationId?: number 
    costAreaId?: number
    status: string
    employmentDate: Date
    terminationDate?: Date
    reemployed?: boolean
    resident?: boolean
    unionMember?: boolean
    statusLastModifiedAt?: Date
    createdAt: Date
    modifiedAt?: Date
  }


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