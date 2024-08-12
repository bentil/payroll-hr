import { Department, Employee, PayrollCompany } from '@prisma/client';

export interface DepartmentEvent extends Department {
  company?: PayrollCompany;
  employees?: Employee[];
}