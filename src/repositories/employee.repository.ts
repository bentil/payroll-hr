import { Prisma, Employee, GradeLevel, PayrollCompany } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { EmployeeEvent } from '../domain/events/employee.event';

export async function create(data: Prisma.EmployeeCreateInput): Promise<Employee> {
  try {
    return prisma.employee.create({ data });
  }
  catch (err) {
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
  { majorGradeLevelId, companyId, ...dtoData }: Omit<EmployeeEvent, 'createdAt' | 'modifiedAt'>
): Promise<Employee> {
  const data: Prisma.EmployeeCreateInput = {
    ...dtoData,
    majorGradeLevel: majorGradeLevelId?  { connect: { id: majorGradeLevelId } } : undefined,
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
    paginate ? prisma.employee.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findDeep(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeWhereInput,
  orderBy?: Prisma.EmployeeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<Employee>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employee.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: { majorGradeLevel: {
        include: { companyLevel: true }
      } }
    }),
    
    paginate ? prisma.employee.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export interface EmployeeDto extends Employee {
  majorGradeLevel?: GradeLevel,
  company?: PayrollCompany,
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeWhereUniqueInput,
  includeRelations?: boolean
): Promise<EmployeeDto | null>  {
  return await prisma.employee.findUnique({
    where: whereUniqueInput,
    include: includeRelations ?
      { majorGradeLevel: { include: { companyLevel: true } }, company: true } : undefined
  });
}


export async function findFirst(where: Prisma.EmployeeWhereInput): Promise<Employee | null> {
  return prisma.employee.findFirst({ where });
}

export async function update(params: {
  where: Prisma.EmployeeWhereUniqueInput,
  data: Prisma.EmployeeUpdateInput
}) {
  const { where, data } = params;
  return prisma.employee.update({
    where,
    data
  });
}  