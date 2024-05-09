import { PayPeriod, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';
import { PayPeriodEvent } from '../domain/events/pay-period.event';
 
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


export async function create(data: Prisma.PayPeriodCreateInput): Promise<PayPeriod> {
  try {
    return await prisma.payPeriod.create({ data });
  }
  catch (err) {
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
