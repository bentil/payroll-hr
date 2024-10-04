import { OvertimePaymentTier, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { getListWithPagination } from './types';
import { OvertimePaymentTierEvent } from '../domain/events/overtime-payment-tier.event';
import { RecordInUse } from '../errors/http-errors';
 
export async function createOrUpdate(
  { 
    currencyId, 
    overtimeId, 
    ...dtoData 
  }:  Omit<OvertimePaymentTierEvent, 'createdAt' | 'modifiedAt'>
): Promise<OvertimePaymentTier> {
  const data: Prisma.OvertimePaymentTierCreateInput = {
    ...dtoData,
    companyCurrency: currencyId? { connect: { id: currencyId } }: undefined,
    overtime: { connect: { id: overtimeId } }
  };
  const { id, ...dataWithoutId } = data;
  return prisma.overtimePaymentTier.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.OvertimePaymentTierWhereUniqueInput
): Promise<OvertimePaymentTier | null> {
  return prisma.overtimePaymentTier.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.OvertimePaymentTierWhereInput,
): Promise<OvertimePaymentTier | null> {
  return prisma.overtimePaymentTier.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.OvertimePaymentTierWhereInput,
  orderBy?: Prisma.OvertimePaymentTierOrderByWithRelationAndSearchRelevanceInput
}) {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.overtimePaymentTier.findMany(params),
    paginate
      ? prisma.overtimePaymentTier.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOvertimePaymentTier(where: Prisma.OvertimePaymentTierWhereUniqueInput) {
  try {
    return await prisma.overtimePaymentTier.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Overtime payment tier is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}