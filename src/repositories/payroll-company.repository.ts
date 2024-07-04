import { Prisma, PayrollCompany } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';


export async function create(
  data: Prisma.PayrollCompanyCreateInput
): Promise<PayrollCompany> {
  try {
    return await prisma.payrollCompany.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Payroll company already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createOrUpdate(
  data: Prisma.PayrollCompanyCreateInput
): Promise<PayrollCompany> {
  const { id, ...dataWithoutId } = data;
  return prisma.payrollCompany.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.PayrollCompanyWhereUniqueInput
): Promise<PayrollCompany | null>  {
  return await prisma.payrollCompany.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.PayrollCompanyWhereInput,
): Promise<PayrollCompany | null> {
  return prisma.payrollCompany.findFirst({ where });
}

export async function update(params: {
  where: Prisma.PayrollCompanyWhereUniqueInput,
  data: Prisma.PayrollCompanyUpdateInput
}): Promise<PayrollCompany> {
  const { where, data } = params;
  return prisma.payrollCompany.update({
    where,
    data
  });
}