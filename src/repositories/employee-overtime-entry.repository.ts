import { EmployeeOvertimeEntry, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateEmployeeOvertimeEntryDto } from '../domain/dto/employee-overtime-entry.dto';

export async function create(
  { employeeId, payPeriodId, overtimeId, ...dtoData }: CreateEmployeeOvertimeEntryDto,
  include?: Prisma.EmployeeOvertimeEntryInclude,
): Promise<EmployeeOvertimeEntry> {
  const data: Prisma.EmployeeOvertimeEntryCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    payPeriod: { connect: { id: payPeriodId } },
    overtime: { connect: { id: overtimeId } },
  };

  try {
    return await prisma.employeeOvertimeEntry.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee overtime entry already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeOvertimeEntryWhereUniqueInput,
  include?: Prisma.EmployeeOvertimeEntryInclude,
): Promise<EmployeeOvertimeEntry | null> {
  return await prisma.employeeOvertimeEntry.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeOvertimeEntryWhereInput,
  orderBy?: Prisma.EmployeeOvertimeEntryOrderByWithRelationInput
  include?: Prisma.EmployeeOvertimeEntryInclude,
}): Promise<ListWithPagination<EmployeeOvertimeEntry>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeOvertimeEntry.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate 
      ? prisma.employeeOvertimeEntry.count({ where: params.where }) : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.EmployeeOvertimeEntryWhereUniqueInput,
  data: Prisma.EmployeeOvertimeEntryUpdateInput,
  include?: Prisma.EmployeeOvertimeEntryInclude,
}) {
  const { where, data, include } = params;
  try {
    return await prisma.employeeOvertimeEntry.update({ 
      where, 
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee overtime entry already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteEmployeeOvertimeEntry(
  where: Prisma.EmployeeOvertimeEntryWhereUniqueInput
) {
  try {
    return await prisma.employeeOvertimeEntry.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee overtime entry is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}