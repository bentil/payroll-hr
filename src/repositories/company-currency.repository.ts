import { CompanyCurrency, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { CompanyCurrencyEvent } from '../domain/events/company-currency.event';
import { RecordInUse } from '../errors/http-errors';

export async function createOrUpdate(
  { 
    companyId, baseCurrencyId, currencyId, ...dtoData 
  } : Omit<CompanyCurrencyEvent, 'createdAt' | 'modifiedAt'>
): Promise<CompanyCurrency> {
  const data: Prisma.CompanyCurrencyCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
    baseCurrency: { connect: { id: baseCurrencyId } },
    currency: { connect: { id: currencyId } }
  };
  const { id, ...dataWithoutId } = data;
  return prisma.companyCurrency.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.CompanyCurrencyWhereUniqueInput,
  include?: Prisma.CompanyCurrencyInclude
): Promise<CompanyCurrency | null> {
  return prisma.companyCurrency.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function deleteOne(
  where: Prisma.CompanyCurrencyWhereUniqueInput
): Promise<CompanyCurrency> {
  try {
    return await prisma.companyCurrency.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Company currency is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}