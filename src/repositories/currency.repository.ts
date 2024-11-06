import { Currency, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { RecordInUse } from '../errors/http-errors';

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

export async function deleteOne(
  where: Prisma.CurrencyWhereUniqueInput
): Promise<Currency> {
  try {
    return await prisma.currency.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Currency is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}