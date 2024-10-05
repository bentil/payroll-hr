import { Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { LeavePlanDto } from '../domain/dto/leave-plan.dto';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';

export interface CreateLeavePlanObject {
  employeeId: number;
  leavePackageId: number;
  intendedStartDate: Date;
  intendedReturnDate: Date;
  comment: string;
  numberOfDays: number;
}

export async function create(
  { 
    employeeId, leavePackageId, ...dtoData 
  }: CreateLeavePlanObject,
  includeRelations?: boolean,
): Promise<LeavePlanDto> {
  const data: Prisma.LeavePlanCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    leavePackage: { connect: { id: leavePackageId } },
  };
  try {
    return await prisma.leavePlan.create({ 
      data,
      include: includeRelations 
        ?  { employee: true, leavePackage: { include: { leaveType: true } } }
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave plan already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}


export async function findOne(
  whereUniqueInput: Prisma.LeavePlanWhereUniqueInput, includeRelations?: boolean,
): Promise<LeavePlanDto | null> {
  return await prisma.leavePlan.findUnique({
    where: whereUniqueInput,
    include: includeRelations 
      ? { employee: true, leavePackage: { include: { leaveType: true } } } : undefined
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeavePlanWhereInput,
  orderBy?: Prisma.LeavePlanOrderByWithRelationAndSearchRelevanceInput,
  includeRelations?: boolean,
}): Promise<ListWithPagination<LeavePlanDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leavePlan.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations ? { employee: true, leavePackage: {
        include: { leaveType: true }
      } } : undefined
    }),
    paginate ? prisma.leavePlan.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.LeavePlanWhereUniqueInput,
  data: Prisma.LeavePlanUpdateInput,
  includeRelations?: boolean
}) {
  const { where, data, includeRelations } = params;
  try {
    return await prisma.leavePlan.update({ 
      where, 
      data,
      include: includeRelations 
        ? { employee: true, leavePackage: { include: { leaveType: true } } } 
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave plan already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(where: Prisma.LeavePlanWhereUniqueInput) {
  try {
    return await prisma.leavePlan.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave plan is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}
