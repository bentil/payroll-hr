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
  LeaveResponseInputDto,
  UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto
} from '../domain/dto/leave-request.dto';
import {
  AlreadyExistsError,
  InputError,
  RecordInUse
} from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { countWorkingDaysForAdjustment } from '../services/holiday.service';

export class CreateLeaveRequestObject {
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
  include?: Prisma.LeaveRequestInclude,
): Promise<LeaveRequestDto> {
  const data: Prisma.LeaveRequestCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    leavePackage: { connect: { id: leavePackageId } },
  };
  try {
    return await prisma.leaveRequest.create({ 
      data,
      include
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
  include?: Prisma.LeaveRequestInclude,
): Promise<LeaveRequestDto | null> {
  return await prisma.leaveRequest.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number;
  take?: number;
  where?: Prisma.LeaveRequestWhereInput;
  orderBy?: Prisma.LeaveRequestOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.LeaveRequestInclude;
  select?: Prisma.LeaveRequestSelect
}): Promise<ListWithPagination<LeaveRequestDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.leaveRequest.findMany(params),
    paginate
      ? prisma.leaveRequest.count({ where: params.where })
      : Promise.resolve(undefined),
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
  skip?: number;
  take?: number;
  where?: Prisma.LeaveResponseWhereInput;
  orderBy?: Prisma.LeaveResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.LeaveResponseInclude;
}): Promise<LeaveResponse[]> {
  const data = await prisma.leaveResponse.findMany(params);

  return data;
}

export async function findFirstResponse(params: {
  where: Prisma.LeaveResponseWhereInput;
  orderBy?: Prisma.LeaveResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.LeaveResponseInclude;
}): Promise<LeaveResponse | null> {
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
  where: Prisma.LeaveRequestWhereUniqueInput;
  data: Prisma.LeaveRequestUpdateInput | Prisma.LeaveRequestUncheckedUpdateInput;
  include?: Prisma.LeaveRequestInclude;
  updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
}): Promise<LeaveRequestDto> {
  const { where, data, include, updateEmployeeLeaveTypeSummary } = params;
  
  try {
    return await prisma.$transaction(async (trxn) => {
      if (updateEmployeeLeaveTypeSummary) {
        const {
          employeeId,
          leaveTypeId,
          year,
          numberOfDaysPending,
        } = updateEmployeeLeaveTypeSummary;

        await trxn.employeeLeaveTypeSummary.update({
          where: { employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year
          } },
          data: {
            numberOfDaysPending
          }
        });
      }
      
      return await trxn.leaveRequest.update({ 
        where, 
        data,
        include,
      });
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

export async function deleteOne(
  where: Prisma.LeaveRequestWhereUniqueInput,
  updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto
): Promise<LeaveRequest> {
  try {
    return await prisma.$transaction(async (trxn) => {
      if (updateEmployeeLeaveTypeSummary) {
        const {
          employeeId,
          leaveTypeId,
          year,
          numberOfDaysPending,
        } = updateEmployeeLeaveTypeSummary;

        await trxn.employeeLeaveTypeSummary.update({
          where: { employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year
          } },
          data: {
            numberOfDaysPending
          }
        });
      }
      return trxn.leaveRequest.delete({ where });
    });
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
  include?: Prisma.LeaveRequestInclude;
  updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
}): Promise<LeaveRequestDto> {
  const { id, cancelledByEmployeeId, include, updateEmployeeLeaveTypeSummary } = params;
  return await prisma.$transaction(async (trxn) => {
    if (updateEmployeeLeaveTypeSummary) {
      const {
        employeeId,
        leaveTypeId,
        year,
        numberOfDaysPending,
      } = updateEmployeeLeaveTypeSummary;

      await trxn.employeeLeaveTypeSummary.update({
        where: { employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year
        } },
        data: {
          numberOfDaysPending
        }
      });
    }

    return await trxn.leaveRequest.update({ 
      where: { id }, 
      data: {
        status: LEAVE_REQUEST_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelledByEmployee: { connect: { id: cancelledByEmployeeId } },
      },
      include,
    });
  });
}

export async function respond(params: {
  id: number;
  data: LeaveResponseInputDto & { 
    approvingEmployeeId: number, 
    finalApproval: boolean,
    approverLevel: number
  };
  include?: Prisma.LeaveRequestInclude,
  updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto
}): Promise<LeaveRequestDto> {
  const { id, data, include, updateEmployeeLeaveTypeSummary } = params;
  
  let requestStatus: LEAVE_REQUEST_STATUS | undefined,
    responseType: LEAVE_RESPONSE_TYPE;
  switch (data.action) {
    case LeaveResponseAction.APPROVE:
      requestStatus = data.finalApproval
        ? LEAVE_REQUEST_STATUS.APPROVED
        : undefined;
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
    return await prisma.$transaction(async (trxn) =>  {
      if (updateEmployeeLeaveTypeSummary) {
        const {
          employeeId,
          leaveTypeId,
          year,
          numberOfDaysPending,
          carryOverDays,
          numberOfDaysUsed,
          numberOfCarryOverDaysUsed
        } = updateEmployeeLeaveTypeSummary;

        await trxn.employeeLeaveTypeSummary.update({
          where: { employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year
          } },
          data: {
            numberOfDaysPending,
            carryOverDays,
            numberOfDaysUsed,
            numberOfCarryOverDaysUsed,
          }
        });
      }
      return await trxn.leaveRequest.update({
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
  data: AdjustDaysDto & { respondingEmployeeId: number, newReturnDate: Date };
  include?: Prisma.LeaveRequestInclude;
  updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
}): Promise<LeaveRequestDto> {
  const { id, data, include, updateEmployeeLeaveTypeSummary } = params;

  try {
    return await prisma.$transaction(async (trxn) => {
      const leaveRequest = await trxn.leaveRequest.update({
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
          },
          returnDate: data.newReturnDate
        },
        include,
      });

      if (updateEmployeeLeaveTypeSummary) {
        const {
          employeeId,
          leaveTypeId,
          year,
          prevNumberOfDays,
          numberOfDaysUsed,
          considerPublicHolidayAsWorkday,
          considerWeekendAsWorkday,
          organizationId,
          numberOfDaysAllowed,
          numberOfDaysLeft,
          numberOfDaysPending,
        } = updateEmployeeLeaveTypeSummary;
        let newNumberOfDays = await countWorkingDaysForAdjustment({ 
          startDate: leaveRequest.startDate, 
          endDate: data.newReturnDate, 
          considerPublicHolidayAsWorkday,
          considerWeekendAsWorkday,
          organizationId: organizationId!
        });
        newNumberOfDays = data.adjustment === AdjustmentOptions.INCREASE
          ? newNumberOfDays + 1
          : newNumberOfDays;
        const newNumberOfDaysUsed = (numberOfDaysUsed! + newNumberOfDays) - prevNumberOfDays!;
        let newCarryOverDays: number | undefined, newNumberOfCarryOverDaysUsed: number | undefined;
        
        const newNumberOfDaysLeft = numberOfDaysLeft! + prevNumberOfDays! - newNumberOfDaysUsed;
        
        if (newNumberOfDaysLeft > numberOfDaysAllowed!) {
          newCarryOverDays = newNumberOfDaysLeft - numberOfDaysAllowed!;
          newNumberOfCarryOverDaysUsed = (newNumberOfDaysLeft! + newNumberOfDaysUsed!) 
            - (numberOfDaysAllowed! + newCarryOverDays);
        } else {
          newCarryOverDays = 0;
          newNumberOfCarryOverDaysUsed = 
            (newNumberOfDaysUsed + newNumberOfDaysLeft) - numberOfDaysAllowed!;
        }
        await trxn.employeeLeaveTypeSummary.update({
          where: { employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year
          } },
          data: {
            numberOfDaysUsed: newNumberOfDaysUsed,
            carryOverDays: newCarryOverDays,
            numberOfDaysPending,
            numberOfCarryOverDaysUsed: newNumberOfCarryOverDaysUsed
          }
        });
      }
      

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

export async function convertLeavePlanToRequest(
  { 
    employeeId, leavePackageId, ...dtoData 
  }: CreateLeaveRequestObject &  { leavePlanId: number },
  include?: Prisma.LeaveRequestInclude,
): Promise<LeaveRequestDto> {
  const { leavePlanId, ...remainingData } = dtoData;
  const data: Prisma.LeaveRequestCreateInput = {
    ...remainingData,
    employee: { connect: { id: employeeId } },
    leavePackage: { connect: { id: leavePackageId } },
  };
  try {
    return await prisma.$transaction(async txn => {
      await txn.leavePlan.delete({ where: { id: leavePlanId } });

      return await txn.leaveRequest.create({ 
        data,
        include
      });
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