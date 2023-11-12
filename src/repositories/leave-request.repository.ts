import { Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { 
  CancelLeaveRequestDto,
  CreateLeaveRequestDto, 
  CreateLeaveResponseDto, 
  LeaveRequestDto, 
} from '../domain/dto/leave-request.dto';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';

export async function create(
  { 
    employeeId, leavePackageId, ...dtoData 
  }: CreateLeaveRequestDto,
  includeRelations?: boolean,
): Promise<LeaveRequestDto> {
  const data: Prisma.LeaveRequestCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    leavePackage: { connect: { id: leavePackageId } },
  };
  try {
    return await prisma.leaveRequest.create({ 
      data,
      include: includeRelations 
        ?  { employee: true, leavePackage: { include: { leaveType: true } } }
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}


export async function findOne(
  whereUniqueInput: Prisma.LeaveRequestWhereUniqueInput, includeRelations?: boolean,
): Promise<LeaveRequestDto | null> {
  return await prisma.leaveRequest.findUnique({
    where: whereUniqueInput,
    include: includeRelations 
      ? { employee: true, leavePackage: { include: { leaveType: true } } } : undefined
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeaveRequestWhereInput,
  orderBy?: Prisma.LeaveRequestOrderByWithRelationAndSearchRelevanceInput,
  includeRelations?: boolean,
}): Promise<ListWithPagination<LeaveRequestDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations ? { leavePackage: {
        include: { leaveType: true }
      } } : undefined
    }),
    paginate ? prisma.leaveRequest.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.LeaveRequestWhereUniqueInput,
  data: Prisma.LeaveRequestUpdateInput,
  includeRelations?: boolean
}) {
  const { where, data, includeRelations } = params;
  try {
    return await prisma.leaveRequest.update({ 
      where, 
      data,
      include: includeRelations 
        ? { leavePackage: { include: { leaveType: true } } } 
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Leave request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteLeaveRequest(where: Prisma.LeaveRequestWhereUniqueInput) {
  try {
    return await prisma.leaveRequest.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Leave request is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function cancel(params: {
    where: Prisma.LeaveRequestWhereUniqueInput,
    updateData: CancelLeaveRequestDto,
    includeRelations?: boolean
  }) {
  const { where, updateData, includeRelations } = params;
  const { cancelledByEmployeeId, ...dtoData } = updateData;
  const data: Prisma.LeaveRequestUpdateInput = {
    ...dtoData,
    cancelledByEmployee: { connect: { id: cancelledByEmployeeId } },
  };
  return await prisma.leaveRequest.update({ 
    where, 
    data,
    include: includeRelations 
      ? { leavePackage: { include: { leaveType: true } } } 
      : undefined
  });
}

export async function respond(params: {
  where: Prisma.LeaveRequestWhereUniqueInput,
  data: CreateLeaveResponseDto,
  }) {
  const { where, data } = params;

  try {
    return await prisma.$transaction(async (transaction) => {
      const leaveRequest = await transaction.leaveRequest.update({
        where, data: { status: data.status, responsecompletedat: data.responseCompletedAt }
      });
      await transaction.leaveResponse.create({
        data: {
          leaveRequestId: data.leaveRequestId,
          approvingEmployeeId: data.approvingEmployeeId,
          comment: data.comment,
          responseType: data.responseType
        }
      });
      return leaveRequest;
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