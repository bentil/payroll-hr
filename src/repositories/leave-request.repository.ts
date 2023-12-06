import {
  LEAVE_REQUEST_STATUS,
  LEAVE_RESPONSE_TYPE,
  LeaveRequest,
  Prisma
} from '@prisma/client';
import { prisma } from '../components/db.component';
import {
  ADJUSTMENT_OPTIONS,
  AdjustDaysDto,
  LEAVE_RESPONSE_ACTION,
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

export const findFirst = async (
  where: Prisma.LeaveRequestWhereInput,
): Promise<LeaveRequestDto | null> => {
  return prisma.leaveRequest.findFirst({ where });
};

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
  data: LeaveResponseInputDto & { approvingEmployeeId: number };
  includeRelations?: boolean;
}): Promise<LeaveRequest> {
  const { id, data, includeRelations } = params;
  
  let requestStatus: LEAVE_REQUEST_STATUS, responseType: LEAVE_RESPONSE_TYPE;
  switch (data.action) {
    case LEAVE_RESPONSE_ACTION.APPROVE:
      requestStatus = LEAVE_REQUEST_STATUS.APPROVED;
      responseType = LEAVE_RESPONSE_TYPE.APPROVED;
      break;
    case LEAVE_RESPONSE_ACTION.DECLINE:
      requestStatus = LEAVE_REQUEST_STATUS.DECLINED;
      responseType = LEAVE_RESPONSE_TYPE.DECLINED;
      break;
    default:
      throw new InputError({ message: 'Invalid leave response type' });
  }

  try {
    return await prisma.$transaction(async (txn) => {
      const leaveRequest = await txn.leaveRequest.update({
        where: { id },
        data: {
          status: requestStatus,
          responsecompletedat: new Date()
        },
        include: includeRelations 
          ? { leavePackage: { include: { leaveType: true } } } 
          : undefined
      });
      await txn.leaveResponse.create({
        data: {
          leaveRequest: { connect: { id } },
          employee: { connect: { id: data.approvingEmployeeId } },
          comment: data.comment,
          responseType
        }
      });

      return leaveRequest;
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
}): Promise<LeaveRequest> {
  const { id, data } = params;

  try {
    return await prisma.$transaction(async (txn) => {
      const leaveRequest = await txn.leaveRequest.update({
        where: { id },
        data: {
          numberOfDays: data.adjustment === ADJUSTMENT_OPTIONS.DECREASE
            ? { decrement: data.count }
            : { increment: data.count }
        },
        include: {
          leavePackage: {
            include: { leaveType: true }
          }
        }
      });
      await txn.leaveResponse.create({
        data: {
          leaveRequest: { connect: { id } },
          comment: data.comment,
          responseType: LEAVE_RESPONSE_TYPE.ADJUSTED,
          employee: { connect: { id: data.respondingEmployeeId } }
        }
      });
      
      return leaveRequest;
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