import { LeaveType, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { LeaveTypeDto } from '../domain/dto/leave-type.dto';


export async function create(
  data: Prisma.LeaveTypeCreateInput
): Promise<LeaveType> {
  try {
    return await prisma.leaveType.create({ data });
  } catch (err) {
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
}

export async function findOne(
  whereUniqueInput: Prisma.LeaveTypeWhereUniqueInput
): Promise<LeaveType | null> {
  return prisma.leaveType.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.LeaveTypeWhereInput,
): Promise<LeaveType | null> {
  return prisma.leaveType.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeaveTypeWhereInput,
  orderBy?: Prisma.LeaveTypeOrderByWithRelationInput,
  include?: Prisma.LeaveTypeInclude
}): Promise<ListWithPagination<LeaveTypeDto>> {
  const { skip, take, } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leaveType.findMany(params),
    paginate
      ? prisma.leaveType.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function search(
  params: {
    skip?: number,
    take?: number,
    orderBy?: Prisma.LeaveTypeOrderByWithRelationInput
  },
  searchParam?: string
): Promise<ListWithPagination<LeaveType>> {
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
}

export async function update(params: {
  where: Prisma.LeaveTypeWhereUniqueInput,
  data: Prisma.LeaveTypeUpdateInput
}): Promise<LeaveType> {
  const { where, data } = params;
  try {
    return await prisma.leaveType.update({
      where,
      data
    });
  } catch (err) {
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
}

export async function deleteOne(
  whereUniqueInput: Prisma.LeaveTypeWhereUniqueInput
): Promise<LeaveType> {
  try {
    return await prisma.leaveType.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave type is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}