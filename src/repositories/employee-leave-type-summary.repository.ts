import { EmployeeLeaveTypeSummary, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateEmployeeLeaveTypeSummaryDto } from '../domain/dto/employee-leave-type-summary.dto';

export async function create(
  { employeeId, leaveTypeId, ...remainingData }: CreateEmployeeLeaveTypeSummaryDto
): Promise<EmployeeLeaveTypeSummary> {
  const data: Prisma.EmployeeLeaveTypeSummaryCreateInput = {
    ...remainingData,
    employee: { connect: { id: employeeId } },
    leaveType: { connect: { id: leaveTypeId } },
  };
  try {
    return await prisma.employeeLeaveTypeSummary.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave type summary already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeLeaveTypeSummaryWhereUniqueInput
): Promise<EmployeeLeaveTypeSummary | null> {
  return prisma.employeeLeaveTypeSummary.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.EmployeeLeaveTypeSummaryWhereInput,
): Promise<EmployeeLeaveTypeSummary | null> {
  return prisma.employeeLeaveTypeSummary.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeLeaveTypeSummaryWhereInput,
  orderBy?: Prisma.EmployeeLeaveTypeSummaryOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.EmployeeLeaveTypeSummaryInclude
}): Promise<ListWithPagination<EmployeeLeaveTypeSummary>> {
  const { skip, take, } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeLeaveTypeSummary.findMany(params),
    paginate
      ? prisma.employeeLeaveTypeSummary.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.EmployeeLeaveTypeSummaryWhereUniqueInput,
  data: Prisma.EmployeeLeaveTypeSummaryUpdateInput
}): Promise<EmployeeLeaveTypeSummary> {
  const { where, data } = params;
  try {
    return await prisma.employeeLeaveTypeSummary.update({
      where,
      data
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee leave type summary already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  whereUniqueInput: Prisma.EmployeeLeaveTypeSummaryWhereUniqueInput
): Promise<EmployeeLeaveTypeSummary> {
  try {
    return await prisma.employeeLeaveTypeSummary.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave type is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createOrUpdate(
  data: CreateEmployeeLeaveTypeSummaryDto
): Promise<EmployeeLeaveTypeSummary> {
  const { employeeId, leaveTypeId, year, ...dataWithoutId } = data;
  return prisma.employeeLeaveTypeSummary.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    create: data,
    update: dataWithoutId,
  });
}