import { CompanyLevelLeavePackage, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { 
  CreateCompanyLevelLeavePackageRecord, 
  CompanyLevelLeavePackageDto 
} from '../domain/dto/company-level-leave-package.dto';
import { AlreadyExistsError } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  data: Prisma.CompanyLevelLeavePackageCreateInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
): Promise<CompanyLevelLeavePackage> {
  try {
    return await prisma.companyLevelLeavePackage.create({ data, include });
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

export async function createMany(
  data: CreateCompanyLevelLeavePackageRecord[],
  include?: Prisma.CompanyLevelLeavePackageInclude
): Promise<CompanyLevelLeavePackageDto[]> {
  const companyLevelLeavePackages: CompanyLevelLeavePackageDto[] = [];
  await prisma.$transaction(async txn => {
    for (const companyLevelLeavePackagesToCreate of data) {
      try {
        const createdCompanyLevelLeavePackage = await txn
          .companyLevelLeavePackage
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
}

export async function findOne(
  whereUniqueInput: Prisma.CompanyLevelLeavePackageWhereUniqueInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
): Promise<CompanyLevelLeavePackage | null> {
  return prisma.companyLevelLeavePackage.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where: Prisma.CompanyLevelLeavePackageWhereInput,
): Promise<CompanyLevelLeavePackage | null> {
  return prisma.companyLevelLeavePackage.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyLevelLeavePackageWhereInput,
  include?: Prisma.CompanyLevelLeavePackageInclude
  orderBy?: Prisma.CompanyLevelLeavePackageOrderByWithRelationInput
}): Promise<ListWithPagination<CompanyLevelLeavePackage>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyLevelLeavePackage.findMany(params),
    paginate
      ? prisma.companyLevelLeavePackage.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOne(
  whereUniqueInput: Prisma.CompanyLevelLeavePackageWhereUniqueInput
): Promise<CompanyLevelLeavePackage> {
  return await prisma.companyLevelLeavePackage.delete({
    where: whereUniqueInput
  });
}