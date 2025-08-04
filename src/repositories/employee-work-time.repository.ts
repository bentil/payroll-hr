import { EmployeeWorkTime, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateEmployeeWorkTimeDto } from '../domain/dto/employee-work-time.dto';

export async function create(
  { employeeId, payPeriodId, ...dtoData }: CreateEmployeeWorkTimeDto,
  include?: Prisma.EmployeeWorkTimeInclude,
): Promise<EmployeeWorkTime> {
  const data: Prisma.EmployeeWorkTimeCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    payPeriod: { connect: { id: payPeriodId } }
  };

  try {
    return await prisma.employeeWorkTime.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee work time already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeWorkTimeWhereUniqueInput,
  include?: Prisma.EmployeeWorkTimeInclude,
): Promise<EmployeeWorkTime | null> {
  return await prisma.employeeWorkTime.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeWorkTimeWhereInput,
  orderBy?: Prisma.EmployeeWorkTimeOrderByWithRelationInput
  include?: Prisma.EmployeeWorkTimeInclude,
}): Promise<ListWithPagination<EmployeeWorkTime>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeWorkTime.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate 
      ? prisma.employeeWorkTime.count({ where: params.where }) : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.EmployeeWorkTimeWhereUniqueInput,
  data: Prisma.EmployeeWorkTimeUpdateInput,
  include?: Prisma.EmployeeWorkTimeInclude,
}) {
  const { where, data, include } = params;
  try {
    return await prisma.employeeWorkTime.update({ 
      where, 
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee work time already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteEmployeeWorkTime(
  where: Prisma.EmployeeWorkTimeWhereUniqueInput
) {
  try {
    return await prisma.employeeWorkTime.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee work time is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}