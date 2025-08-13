import { Prisma, Employee } from '@prisma/client';
import { prisma } from '../components/db.component';
import { EmployeeDto, EmployeeEvent } from '../domain/events/employee.event';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  { departmentId, companyId,  ...dtoData }: EmployeeEvent
): Promise<Employee> {
  const data: Prisma.EmployeeCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
    department: departmentId ? { connect: { id: departmentId } } : undefined
  };
  try {
    return await prisma.employee.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createOrUpdate(
  {
    majorGradeLevelId,
    companyId,
    departmentId,
    ...dtoData
  }: Omit<EmployeeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Employee> {
  const data: Prisma.EmployeeCreateInput = {
    ...dtoData,
    majorGradeLevel: majorGradeLevelId
      ? { connect: { id: majorGradeLevelId } } : undefined,
    company: { connect: { id: companyId } },
    department: departmentId ? { connect: { id: departmentId } } : undefined
  };
  const { id, ...dataWithoutId } = data;
  return prisma.employee.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeWhereInput,
  orderBy?: Prisma.EmployeeOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.EmployeeInclude
}): Promise<ListWithPagination<EmployeeDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employee.findMany(params),
    paginate
      ? prisma.employee.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeWhereUniqueInput,
  include?: Prisma.EmployeeInclude,
): Promise<EmployeeDto | null>  {
  return prisma.employee.findUnique({
    where: whereUniqueInput,
    include,
  });
}

export async function findFirst(
  where: Prisma.EmployeeWhereInput,
  include?: Prisma.EmployeeInclude
): Promise<Employee | null> {
  return prisma.employee.findFirst({ where, include });
}

export async function count(
  where: Prisma.EmployeeWhereInput
): Promise<number> {
  return prisma.employee.count({ where });
}

export async function update(params: {
  where: Prisma.EmployeeWhereUniqueInput,
  data: Prisma.EmployeeUpdateInput
}): Promise<Employee> {
  const { where, data } = params;
  return prisma.employee.update({
    where,
    data
  });
}

export async function deleteOne(
  where: Prisma.EmployeeWhereUniqueInput
): Promise<Employee> {
  try {
    return await prisma.employee.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}