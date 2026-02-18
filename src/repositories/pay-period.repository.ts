import { PayPeriod, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { PayPeriodEvent } from '../domain/events/pay-period.event';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';


export async function createOrUpdate(
  data:  Omit<PayPeriodEvent, 'createdAt' | 'modifiedAt'>
): Promise<PayPeriod> {
  const { id, ...dataWithoutId } = data;
  return prisma.payPeriod.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function create(
  data: Prisma.PayPeriodCreateInput
): Promise<PayPeriod> {
  try {
    return await prisma.payPeriod.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Pay Period already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.PayPeriodWhereUniqueInput
): Promise<PayPeriod | null> {
  return prisma.payPeriod.findUnique({
    where: whereUniqueInput
  });
}

export async function deleteOne(
  where: Prisma.PayPeriodWhereUniqueInput
): Promise<PayPeriod> {
  try {
    return await prisma.payPeriod.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Pay period is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findFirst(
  where: Prisma.PayPeriodWhereInput,
): Promise<PayPeriod | null> {
  return prisma.payPeriod.findFirst({ where });
}
