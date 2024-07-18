import { DepartmentLeadership, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { RecordInUse } from '../errors/http-errors';

export class CreateDepartmentLeadershipDto {
  id!: number;
  departmentId!: number;
  rank!: number;
  permanent?: boolean;
  employeeId?: number | null;
}

export async function createOrUpdate(
  { departmentId, employeeId, ...dtoData }: CreateDepartmentLeadershipDto
): Promise<DepartmentLeadership> {
  const data: Prisma.DepartmentLeadershipCreateInput = {
    ...dtoData,
    department: { connect: { id: departmentId } },
    employee: employeeId ? { connect: { id: employeeId } } : undefined
  };
  const { id, ...dataWithoutId } = data;
  return prisma.departmentLeadership.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.DepartmentLeadershipWhereUniqueInput,
): Promise<DepartmentLeadership | null> {
  return prisma.departmentLeadership.findUnique({
    where: whereUniqueInput,
  });
}

export async function findFirst(
  where: Prisma.DepartmentLeadershipWhereInput,
  include?: Prisma.DepartmentLeadershipInclude
): Promise<DepartmentLeadership | null> {
  return prisma.departmentLeadership.findFirst({ where, include });
}

export async function deleteOne(where: Prisma.DepartmentLeadershipWhereUniqueInput) {
  try {
    return await prisma.departmentLeadership.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Department leadership is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}