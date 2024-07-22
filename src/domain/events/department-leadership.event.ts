import { DepartmentLeadership, Employee, PayrollCompany } from '@prisma/client';

export interface DepartmentLeadershipEvent extends DepartmentLeadership{
  department?: PayrollCompany;
  employee?: Employee;
}