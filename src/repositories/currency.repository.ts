import { Currency, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';

export async function createOrUpdate(
  data: Prisma.CurrencyCreateInput
): Promise<Currency> {
  const { id, ...dataWithoutId } = data;
  return prisma.currency.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.CurrencyWhereUniqueInput,
): Promise<Currency | null> {
  return prisma.currency.findUnique({
    where: whereUniqueInput,
  });
}