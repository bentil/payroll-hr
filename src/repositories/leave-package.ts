import { LeavePackage, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { CreateLeavePackageDto } from '../domain/dto/leave-package.dto';
import { getListWithPagination } from './types';

export async function create(
  createLeavePackageDto: CreateLeavePackageDto,
  include: Prisma.LeavePackageInclude
): Promise<LeavePackage> {
  const { companyLevelIds, ...createLeavePackageData } = createLeavePackageDto;

  try {
    return await prisma.leavePackage.create({ data: {
      ...createLeavePackageData,
      companyLevelLeavePackages: companyLevelIds && {
        createMany: {
          data: companyLevelIds.map(
            (companyLevelId) => { return { companyLevelId }; }
          ),
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


export const findOne = async (
  whereUniqueInput: Prisma.LeavePackageWhereUniqueInput,
  include?: Prisma.LeavePackageInclude
): Promise<LeavePackage | null> => {
  return prisma.leavePackage.findUnique({
    where: whereUniqueInput,
    include
  });
};

export const findFirst = async (
  where: Prisma.LeavePackageWhereInput,
): Promise<LeavePackage | null> => {
  return prisma.leavePackage.findFirst({ where });
};

export const find = async (params: {
  skip?: number,
  take?: number,
  include?: Prisma.LeavePackageInclude,
  where?: Prisma.LeavePackageWhereInput,
  orderBy?: Prisma.LeavePackageOrderByWithRelationAndSearchRelevanceInput
}) => {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leavePackage.findMany(params),
    paginate
      ? prisma.leavePackage.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
};

export const search = async (params: {
  skip?: number,
  take?: number,
  orderBy?: Prisma.LeavePackageOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.LeavePackageInclude,
}, searchParam?: string, scopedQuery?: {
  companyId?: number | { in: number[] }
}
) => {
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
    ...scopedQuery
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
};

export const update = async (params: {
  where: Prisma.LeavePackageWhereUniqueInput,
  data: Prisma.LeavePackageUpdateInput,
  include?: Prisma.LeavePackageInclude,

}) => {
  const { where, data, include } = params;
  try {
    return await prisma.leavePackage.update({
      where,
      data,
      include
    });
  }
  catch (err) {
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
};


export const deleteOne = async (
  whereUniqueInput: Prisma.LeavePackageWhereUniqueInput
): Promise<LeavePackage> => {
  try {
    return await prisma.leavePackage.delete({
      where: whereUniqueInput
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave package is currently in use by another model',
          cause: err
        });
      }
    }
    throw err;
  }
};