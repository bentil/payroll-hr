import {
  LEAVE_REQUEST_STATUS,
  LEAVE_RESPONSE_TYPE,
  LeaveRequest,
  LeaveResponse,
  Prisma
} from '@prisma/client';
import { prisma } from '../components/db.component';
import {
  AdjustmentOptions,
  AdjustDaysDto,
  LeaveResponseAction,
  LeaveRequestDto,
  LeaveResponseInputDto
} from '../domain/dto/leave-request.dto';
import {
  AlreadyExistsError,
  InputError,
  RecordInUse
} from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';

export class CreateLeaveRequestObject{
  employeeId!: number;
  leavePackageId!: number;
  startDate!: Date;
  returnDate!: Date;
  comment!: string;
  numberOfDays!: number;
  approvalsRequired!: number;
}

export async function create(
  { 
    employeeId, leavePackageId, ...dtoData 
  }: CreateLeaveRequestObject,
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
  whereUniqueInput: Prisma.LeaveRequestWhereUniqueInput,
  includeRelations?: boolean,
): Promise<LeaveRequestDto | null> {
  return await prisma.leaveRequest.findUnique({
    where: whereUniqueInput,
    include: includeRelations 
      ? { employee: true, leavePackage: { include: { leaveType: true } } }
      : undefined
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeaveRequestWhereInput,
  orderBy?: Prisma.LeaveRequestOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.LeaveRequestInclude,
}): Promise<ListWithPagination<LeaveRequestDto>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate ? prisma.leaveRequest.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findFirst(
  where: Prisma.LeaveRequestWhereInput,
  include: Prisma.LeaveRequestInclude,
): Promise<LeaveRequestDto | null>  {
  return prisma.leaveRequest.findFirst({ where, include });
}

export async function findResponse(params: {
  skip?: number,
  take?: number,
  where?: Prisma.LeaveResponseWhereInput,
  orderBy?: Prisma.LeaveResponseOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.LeaveResponseInclude,
}): Promise<LeaveResponse[]> {
  const data = await prisma.leaveResponse.findMany(params);

  return data;
}

export async function findFirstResponse(params: {
  where: Prisma.LeaveResponseWhereInput,
  orderBy?: Prisma.LeaveResponseOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.LeaveResponseInclude,
}): Promise<LeaveResponse | null>  {
  return prisma.leaveResponse.findFirst(params);
}

export async function findLastResponse(
  where: Prisma.LeaveResponseWhereInput,
  include?: Prisma.LeaveResponseInclude
): Promise<LeaveResponse | null> {
  return await findFirstResponse({ 
    where, 
    orderBy: { id: 'desc' },
    include 
  });
}

export async function update(params: {
  where: Prisma.LeaveRequestWhereUniqueInput,
  data: Prisma.LeaveRequestUpdateInput | Prisma.LeaveRequestUncheckedUpdateInput,
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

export async function remove(where: Prisma.LeaveRequestWhereUniqueInput) {
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
    id: number;
    cancelledByEmployeeId: number;
    includeRelations?: boolean;
  }): Promise<LeaveRequest> {
  const { id, cancelledByEmployeeId, includeRelations } = params;
  return await prisma.leaveRequest.update({ 
    where: { id }, 
    data: {
      status: LEAVE_REQUEST_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelledByEmployee: { connect: { id: cancelledByEmployeeId } },
    },
    include: includeRelations 
      ? { leavePackage: { include: { leaveType: true } } } 
      : undefined
  });
}

export async function respond(params: {
  id: number;
  data: LeaveResponseInputDto & { 
    approvingEmployeeId: number, 
    finalApproval: boolean,
    approverLevel: number
  };
  include?: Prisma.LeaveRequestInclude
}): Promise<LeaveRequest> {
  const { id, data, include } = params;
  
  let requestStatus: LEAVE_REQUEST_STATUS | undefined, responseType: LEAVE_RESPONSE_TYPE;
  switch (data.action) {
  case LeaveResponseAction.APPROVE:
    requestStatus = data.finalApproval ? LEAVE_REQUEST_STATUS.APPROVED : undefined ;
    responseType = LEAVE_RESPONSE_TYPE.APPROVED;
    break;
  case LeaveResponseAction.DECLINE:
    requestStatus = LEAVE_REQUEST_STATUS.DECLINED;
    responseType = LEAVE_RESPONSE_TYPE.DECLINED;
    break;
  default:
    throw new InputError({ message: 'Invalid leave response type' });
  }

  try {
    return await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: requestStatus,
        responseCompletedAt: requestStatus ? new Date() : undefined,
        leaveResponses: {
          create: {
            employee: { connect: { id: data.approvingEmployeeId } },
            comment: data.comment,
            responseType,
            approverLevel: data.approverLevel
          }
        }
      },
      include,
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

export async function adjustDays(params: {
  id: number;
  data: AdjustDaysDto & { respondingEmployeeId: number }
  include?: Prisma.LeaveRequestInclude,
}): Promise<LeaveRequest> {
  const { id, data, include } = params;

  try {
    return await prisma.leaveRequest.update({
      where: { id },
      data: {
        numberOfDays: data.adjustment === AdjustmentOptions.DECREASE
          ? { decrement: data.count }
          : { increment: data.count },
        leaveResponses: {
          create: {
            comment: data.comment,
            responseType: LEAVE_RESPONSE_TYPE.ADJUSTED,
            employee: { connect: { id: data.respondingEmployeeId } }
          }
        }
      },
      include,
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