import { Overtime, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { getListWithPagination } from './types';
import { OvertimeEvent } from '../domain/events/overtime.event';
import { RecordInUse } from '../errors/http-errors';
 
export async function createOrUpdate(
  data:  Omit<OvertimeEvent, 'createdAt' | 'modifiedAt'>
  
): Promise<Overtime> {
  const { id, ...dataWithoutId } = data;
  return prisma.overtime.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.OvertimeWhereUniqueInput
): Promise<Overtime | null> {
  return prisma.overtime.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.OvertimeWhereInput,
): Promise<Overtime | null> {
  return prisma.overtime.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.OvertimeWhereInput,
  orderBy?: Prisma.OvertimeOrderByWithRelationAndSearchRelevanceInput
}) {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.overtime.findMany(params),
    paginate
      ? prisma.overtime.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOne(where: Prisma.OvertimeWhereUniqueInput) {
  try {
    return await prisma.overtime.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Overtime is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}