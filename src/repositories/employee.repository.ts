import { Prisma, Employee, GradeLevel, PayrollCompany } from '@prisma/client';
import { prisma } from '../components/db.component';
import { EmployeeEvent } from '../domain/events/employee.event';
import { AlreadyExistsError } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  data: Prisma.EmployeeCreateInput
): Promise<Employee> {
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
    ...dtoData
  }: Omit<EmployeeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Employee> {
  const data: Prisma.EmployeeCreateInput = {
    ...dtoData,
    majorGradeLevel: majorGradeLevelId
      ? { connect: { id: majorGradeLevelId } } : undefined,
    company: { connect: { id: companyId } },
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
  orderBy?: Prisma.EmployeeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<Employee>> {
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

export interface EmployeeDto extends Employee {
  majorGradeLevel?: GradeLevel,
  company?: PayrollCompany,
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