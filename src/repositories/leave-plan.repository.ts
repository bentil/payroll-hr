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
  include?: Prisma.LeavePlanInclude,
): Promise<LeavePlanDto> {
  const data: Prisma.LeavePlanCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    leavePackage: { connect: { id: leavePackageId } },
  };
  try {
    return await prisma.leavePlan.create({ 
      data,
      include
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
  whereUniqueInput: Prisma.LeavePlanWhereUniqueInput, 
  include?: Prisma.LeavePlanInclude,
): Promise<LeavePlanDto | null> {
  return await prisma.leavePlan.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeavePlanWhereInput,
  orderBy?: Prisma.LeavePlanOrderByWithRelationInput,
  include?: Prisma.LeavePlanInclude,
}): Promise<ListWithPagination<LeavePlanDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leavePlan.findMany(params),
    paginate ? prisma.leavePlan.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.LeavePlanWhereUniqueInput,
  data: Prisma.LeavePlanUpdateInput,
  include?: Prisma.LeavePlanInclude,
}) {
  try {
    return await prisma.leavePlan.update(params);
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
