import { Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { 
  CreateGrievanceReportedEmployeeRecord, 
  ReportedEmployeesDto 
} from '../domain/dto/grievance-reported-employee.dto';

export async function addGrievanceReportedEmployee(
  createData: CreateGrievanceReportedEmployeeRecord[],
  includeRelations?: boolean,
): Promise<ReportedEmployeesDto[]> {
  const reportedEmployees: ReportedEmployeesDto[] = [];
  for (const reportedEmployeeToCreate of createData) {
    const { reportId, reportedEmployeeId } = reportedEmployeeToCreate;
    const data: Prisma.GrievanceReportedEmployeeCreateInput = {
      reportedEmployee: { connect: { id: reportedEmployeeId } },
      grievanceReport: { connect: { id: reportId } },
    };
    try {
      const AddReportedEmployee =  await prisma.grievanceReportedEmployee.create({ 
        data,
        include: includeRelations 
          ?  { reportedEmployee: true, grievanceReport: { include: {
            company: true, reportingEmployee: true, grievanceType: true
          } } } : undefined
      });
      reportedEmployees.push(AddReportedEmployee);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new AlreadyExistsError({
            message: 'Grievance reported employee already exists',
            cause: err
          });
        }
      }
      throw err;
    }
  }
  return reportedEmployees;
}

export async function deleteReportedEmployee(
  where: Prisma.GrievanceReportedEmployeeWhereUniqueInput
) {
  try {
    return await prisma.grievanceReportedEmployee.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Grievance reported employee is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findReportedEmployee(
  whereUniqueInput: Prisma.GrievanceReportedEmployeeWhereUniqueInput, includeRelations?: boolean,
): Promise<ReportedEmployeesDto | null> {
  return await prisma.grievanceReportedEmployee.findUnique({
    where: whereUniqueInput,
    include: includeRelations 
      ? { reportedEmployee: true, grievanceReport: true } : undefined
  });
}