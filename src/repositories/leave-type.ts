import { LeaveType, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { getListWithPagination } from './types';

export const create = async (data: Prisma.LeaveTypeCreateInput): Promise<LeaveType> => {
  try {
    return await prisma.leaveType.create({ data });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};

export const findOne = async (
  whereUniqueInput: Prisma.LeaveTypeWhereUniqueInput
): Promise<LeaveType | null> => {
  return prisma.leaveType.findUnique({
    where: whereUniqueInput
  });
};

export const findFirst = async (
  where: Prisma.LeaveTypeWhereInput,
): Promise<LeaveType | null> => {
  return prisma.leaveType.findFirst({ where });
};

export const find = async (params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeaveTypeWhereInput,
  orderBy?: Prisma.LeaveTypeOrderByWithRelationAndSearchRelevanceInput,
  includeRelations?: boolean
}) => {
  const { skip, take, } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leaveType.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations ? { leavePackages: {
        include: { leaveType: true }
      } } : undefined
    }),
    paginate
      ? prisma.leaveType.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
};

export const search = async (params: {
  skip?: number,
  take?: number,
  orderBy?: Prisma.LeaveTypeOrderByWithRelationAndSearchRelevanceInput
}, searchParam?: string
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
  };
  const [data, totalCount] = await Promise.all([
    prisma.leaveType.findMany({
      where, ...params
    }),
    paginate
      ? prisma.leaveType.count({ where })
      : Promise.resolve(undefined),
  ]);
  return getListWithPagination(data, { skip, take, totalCount });
};

export const update = async (params: {
  where: Prisma.LeaveTypeWhereUniqueInput,
  data: Prisma.LeaveTypeUpdateInput
}) => {
  const { where, data } = params;
  try {
    return await prisma.leaveType.update({
      where,
      data
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};


export const deleteOne = async (
  whereUniqueInput: Prisma.LeaveTypeWhereUniqueInput
): Promise<LeaveType> => {
  try {
    return await prisma.leaveType.delete({
      where: whereUniqueInput
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave type is currently in use by another model',
          cause: err
        });
      }
    }
    throw err;
  }
};