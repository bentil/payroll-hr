import { Department, PayrollCompany } from '@prisma/client';

export interface DepartmentEvent extends Department {
  company?: PayrollCompany;
}