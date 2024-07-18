import { Department, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { RecordInUse } from '../errors/http-errors';
export class CreateDepartmentDto {
  id!: number;
  code!: string;
  name!: string;
  description!: string;
  active?: boolean;
  companyId!: number;
}
export async function createOrUpdate(
  { companyId, ...dtoData } : CreateDepartmentDto,
): Promise<Department> {
  const data: Prisma.DepartmentCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } } 
  };
  const { id, ...dataWithoutId } = data;
  return prisma.department.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.DepartmentWhereUniqueInput,
): Promise<Department | null> {
  return prisma.department.findUnique({
    where: whereUniqueInput,
  });
}

export async function deleteOne(where: Prisma.DepartmentWhereUniqueInput) {
  try {
    return await prisma.department.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Department is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}