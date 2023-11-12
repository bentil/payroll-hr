import { CompanyLevelLeavePackage, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';
import { 
  CreateCompanyLevelLeavePackageRecord, 
  CompanyLevelLeavePackageDto 
} from '../domain/dto/company-level-leave-package.dto';
import { getListWithPagination } from './types';

export const create = async (
  data: Prisma.CompanyLevelLeavePackageCreateInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
): Promise<CompanyLevelLeavePackage> => {
  try {
    return await prisma.companyLevelLeavePackage.create({ data, include });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company level leave package already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};

export const createMany = async (
  data: CreateCompanyLevelLeavePackageRecord[],
  include?: Prisma.CompanyLevelLeavePackageInclude) => {
  const companyLevelLeavePackages: CompanyLevelLeavePackageDto[] = [];
  await prisma.$transaction(async (prismatxn) => {
    for (const companyLevelLeavePackagesToCreate of data) {
      try {
        const createdCompanyLevelLeavePackage = await prismatxn.companyLevelLeavePackage
          .create({ data: companyLevelLeavePackagesToCreate, include });
        companyLevelLeavePackages.push(createdCompanyLevelLeavePackage);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            throw new AlreadyExistsError({
              message: 'Company level leave package already exists',
              cause: err
            });
          }
        }
        throw err;
      }
    }
  });
  return companyLevelLeavePackages;
};

export const findOne = async (
  whereUniqueInput: Prisma.CompanyLevelLeavePackageWhereUniqueInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
): Promise<CompanyLevelLeavePackage | null> => {
  return prisma.companyLevelLeavePackage.findUnique({
    where: whereUniqueInput,
    include
  });
};

export const findFirst = async (
  where: Prisma.CompanyLevelLeavePackageWhereInput,
): Promise<CompanyLevelLeavePackage | null> => {
  return prisma.companyLevelLeavePackage.findFirst({ where });
};

export const find = async (params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyLevelLeavePackageWhereInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
  orderBy?: Prisma.CompanyLevelLeavePackageOrderByWithRelationAndSearchRelevanceInput
}) => {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyLevelLeavePackage.findMany(params),
    paginate
      ? prisma.companyLevelLeavePackage.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
};


export const deleteOne = async (
  whereUniqueInput: Prisma.CompanyLevelLeavePackageWhereUniqueInput
): Promise<CompanyLevelLeavePackage> => {
  return await prisma.companyLevelLeavePackage.delete({
    where: whereUniqueInput
  });
};