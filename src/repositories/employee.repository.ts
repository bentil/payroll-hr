import { Prisma, Employee } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';

export async function create (data: Prisma.EmployeeCreateInput): Promise<Employee> {
  try {
    return prisma.employee.create({ data });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Model already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createOrUpdate(
  data: Prisma.EmployeeCreateInput
): Promise<Employee> {
  const { id, ...dataWithoutId } = data;
  return prisma.employee.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeWhereUniqueInput
): Promise<Employee | null>  {
  return await prisma.employee.findUnique({
    where: whereUniqueInput
  });
}

export async function update (params: {
  where: Prisma.EmployeeWhereUniqueInput,
  data: Prisma.EmployeeUpdateInput
}) {
  const { where, data } = params;
  return prisma.employee.update({
    where,
    data
  });
}  