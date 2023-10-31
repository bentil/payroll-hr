import { Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { 
  CreateGrievanceReportDto, 
  GrievanceReportDto, 
} from '../domain/dto/grievance-report.dto';
import { AlreadyExistsError, FailedDependencyError, RecordInUse } from '../errors/http-errors';
import * as helpers from '../utils/helpers';
import { ListWithPagination, getListWithPagination } from './types';

export async function create(
  { 
    companyId, grievanceTypeId, reportingEmployeeId, ...dtoData 
  }: CreateGrievanceReportDto,
  includeRelations?: boolean,
): Promise<GrievanceReportDto> {
  const data: Prisma.GrievanceReportCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
    grievanceType: { connect: { id: grievanceTypeId } },
    reportingEmployee: { connect: { id: reportingEmployeeId } },
  };
  try {
    return await prisma.grievanceReport.create({ 
      data,
      include: includeRelations 
        ?  { company: true, grievanceType: true, reportingEmployee: true }
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grievance report already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createReportWithReportedEmployee(
  { 
    companyId, grievanceTypeId, reportingEmployeeId, reportedEmployeeId, ...dtoData 
  }: CreateGrievanceReportDto, includeRelations?: boolean
): Promise<GrievanceReportDto> {
  if (!reportedEmployeeId) {
    throw new FailedDependencyError({
      message: 'Dependency check(s) failed',
    });
  }
  const grievanceReportWithgrievanceReportedEmployee = helpers.
    generateMultiGrievanceReportedEmployeesDto(reportedEmployeeId);
  const data: Prisma.GrievanceReportCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
    grievanceType: { connect: { id: grievanceTypeId } },
    reportingEmployee: { connect: { id: reportingEmployeeId } },
    grievanceReportedEmployees: { createMany: { 
      data: grievanceReportWithgrievanceReportedEmployee 
    } }
  };

  let createGrievanceReportResult: GrievanceReportDto;
  try {
    createGrievanceReportResult = await prisma.grievanceReport.create({ 
      data, 
      include: includeRelations 
        ? { 
          company: true, grievanceType: true, 
          reportingEmployee: true, grievanceReportedEmployees: true 
        } : undefined
    });
    return createGrievanceReportResult;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grievance report already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.GrievanceReportWhereUniqueInput, includeRelations?: boolean,
): Promise<GrievanceReportDto | null> {
  return await prisma.grievanceReport.findUnique({
    where: whereUniqueInput,
    include: includeRelations 
      ? { 
        company: true, grievanceType: true, 
        reportingEmployee: true, grievanceReportedEmployees: true 
      } : undefined
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.GrievanceReportWhereInput,
  orderBy?: Prisma.GrievanceReportOrderByWithRelationAndSearchRelevanceInput,
  includeRelations?: boolean,
}): Promise<ListWithPagination<GrievanceReportDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.grievanceReport.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations ? { grievanceType: true } : undefined
    }),
    paginate ? prisma.grievanceReport.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.GrievanceReportWhereUniqueInput,
  data: Prisma.GrievanceReportUpdateInput,
  includeRelations?: boolean
}) {
  const { where, data, includeRelations } = params;
  try {
    return await prisma.grievanceReport.update({ 
      where, 
      data,
      include: includeRelations 
        ? {
          company: true, grievanceType: true, 
          reportingEmployee: true, grievanceReportedEmployees: true 
        } : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grievance report already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function search(params: {
  skip?: number,
  take?: number,
  where?: Prisma.GrievanceReportWhereInput,
  orderBy?: Prisma.GrievanceReportOrderByWithRelationAndSearchRelevanceInput,
  includeRelations?: boolean
}): Promise<ListWithPagination<GrievanceReportDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.grievanceReport.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations ? { grievanceType: true } : undefined
    }),
    paginate ? prisma.grievanceReport.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteGrievanceReport(where: Prisma.GrievanceReportWhereUniqueInput) {
  try {
    return await prisma.grievanceReport.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Grievance report is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}
