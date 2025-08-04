import { LeavePackage, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { CreateLeavePackageDto, LeavePackageDto } from '../domain/dto/leave-package.dto';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  createLeavePackageDto: CreateLeavePackageDto,
  include: Prisma.LeavePackageInclude
): Promise<LeavePackage> {
  const { companyLevelIds, ...createLeavePackageData } = createLeavePackageDto;

  try {
    return await prisma.leavePackage.create({
      data: {
        ...createLeavePackageData,
        companyLevelLeavePackages: companyLevelIds && {
          createMany: {
            data: companyLevelIds.map(id => ({ companyLevelId: id })),
            skipDuplicates: true
          }
        }
      }, 
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave package already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.LeavePackageWhereUniqueInput,
  include?: Prisma.LeavePackageInclude
): Promise<LeavePackage | null> {
  return prisma.leavePackage.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where: Prisma.LeavePackageWhereInput,
  include?: Prisma.LeavePackageInclude
): Promise<LeavePackage | null> {
  return prisma.leavePackage.findFirst({ where, include });
}

export async function find(params: {
  skip?: number,
  take?: number,
  include?: Prisma.LeavePackageInclude,
  where?: Prisma.LeavePackageWhereInput,
  orderBy?: Prisma.LeavePackageOrderByWithRelationInput
}): Promise<ListWithPagination<LeavePackageDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leavePackage.findMany(params),
    paginate
      ? prisma.leavePackage.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function search(
  params: {
    skip?: number,
    take?: number,
    orderBy?: Prisma.LeavePackageOrderByWithRelationInput,
    include?: Prisma.LeavePackageInclude,
  },
  searchParam?: string
): Promise<ListWithPagination<LeavePackage>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const where = {
    code: {
      search: searchParam,
    },
    name: {
      search: searchParam,
    },
    description: {
      search: searchParam,
    },
  };
  const [data, totalCount] = await Promise.all([
    prisma.leavePackage.findMany({
      where, ...params
    }),
    paginate
      ? prisma.leavePackage.count({ where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.LeavePackageWhereUniqueInput,
  data: Prisma.LeavePackageUpdateInput,
  include?: Prisma.LeavePackageInclude,
}): Promise<LeavePackage> {
  const { where, data, include } = params;
  try {
    return await prisma.leavePackage.update({
      where,
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave package already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  whereUniqueInput: Prisma.LeavePackageWhereUniqueInput
): Promise<LeavePackage> {
  try {
    return await prisma.leavePackage.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave package is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}