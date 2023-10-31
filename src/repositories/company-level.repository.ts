import { CompanyLevel, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';
import { getListWithPagination } from './types';

export async function create(data: Prisma.CompanyLevelCreateInput): Promise<CompanyLevel> {
  try {
    return await prisma.companyLevel.create({ data });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company level already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createOrUpdate(
  data: Prisma.CompanyLevelCreateInput
): Promise<CompanyLevel> {
  const { id, ...dataWithoutId } = data;
  return prisma.companyLevel.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.CompanyLevelWhereUniqueInput,
  include?: Prisma.CompanyLevelInclude
): Promise<CompanyLevel | null> {
  return prisma.companyLevel.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where: Prisma.CompanyLevelWhereInput,
): Promise<CompanyLevel | null> {
  return prisma.companyLevel.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyLevelWhereInput,
  orderBy?: Prisma.CompanyLevelOrderByWithRelationAndSearchRelevanceInput
}) {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyLevel.findMany(params),
    paginate
      ? prisma.companyLevel.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.CompanyLevelWhereUniqueInput,
  data: Prisma.CompanyLevelUpdateInput
}) {
  const { where, data } = params;
  return await prisma.companyLevel.update({
    where,
    data
  });
}
