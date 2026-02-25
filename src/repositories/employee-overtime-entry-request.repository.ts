import { 
  EmployeeOvertimeEntryRequest, 
  EmployeeOvertimeEntryResponse, 
  Prisma, 
  ResponseType, 
  Status
} from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, InputError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import {
  CreateEmployeeOvertimeEntryRequestDto, 
  EmployeeOvertimeEntryAction, 
  EmployeeOvertimeEntryInputDto,
  EmployeeOvertimeEntryRequestDto
} from '../domain/dto/employee-overtime-entry-request.dto';

export async function create(
  { employeeId, payPeriodId, overtimeId, ...dtoData }: CreateEmployeeOvertimeEntryRequestDto,
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
): Promise<EmployeeOvertimeEntryRequestDto> {
  const data: Prisma.EmployeeOvertimeEntryRequestCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    payPeriod: { connect: { id: payPeriodId } },
    overtime: { connect: { id: overtimeId } },
  };

  try {
    return await prisma.employeeOvertimeEntryRequest.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee overtime entry request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeOvertimeEntryRequestWhereUniqueInput,
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
): Promise<EmployeeOvertimeEntryRequest | null> {
  return await prisma.employeeOvertimeEntryRequest.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeOvertimeEntryRequestWhereInput,
  orderBy?: Prisma.EmployeeOvertimeEntryRequestOrderByWithRelationAndSearchRelevanceInput
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
}): Promise<ListWithPagination<EmployeeOvertimeEntryRequest>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeOvertimeEntryRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate 
      ? prisma.employeeOvertimeEntryRequest.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findFirst(
  where: Prisma.EmployeeOvertimeEntryRequestWhereInput,
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
): Promise<EmployeeOvertimeEntryRequestDto | null> {
  return prisma.employeeOvertimeEntryRequest.findFirst({ where, include });
}


export async function findResponse(params: {
  skip?: number;
  take?: number;
  where?: Prisma.EmployeeOvertimeEntryResponseWhereInput;
  orderBy?: Prisma.EmployeeOvertimeEntryResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.EmployeeOvertimeEntryResponseInclude;
}): Promise<EmployeeOvertimeEntryResponse[]> {
  const data = await prisma.employeeOvertimeEntryResponse.findMany(params);

  return data;
}

export async function findFirstResponse(params: {
  where: Prisma.EmployeeOvertimeEntryResponseWhereInput;
  orderBy?: Prisma.EmployeeOvertimeEntryResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.EmployeeOvertimeEntryResponseInclude;
}): Promise<EmployeeOvertimeEntryResponse | null> {
  return prisma.employeeOvertimeEntryResponse.findFirst(params);
}

export async function findLastResponse(
  where: Prisma.EmployeeOvertimeEntryResponseWhereInput,
  include?: Prisma.EmployeeOvertimeEntryResponseInclude
): Promise<EmployeeOvertimeEntryResponse | null> {
  return await findFirstResponse({ 
    where, 
    orderBy: { id: 'desc' },
    include 
  });
}

export async function update(params: {
  where: Prisma.EmployeeOvertimeEntryRequestWhereUniqueInput,
  data: Prisma.EmployeeOvertimeEntryRequestUpdateInput,
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
}) {
  const { where, data, include } = params;
  try {
    return await prisma.employeeOvertimeEntryRequest.update({ 
      where, 
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee overtime entry request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteEmployeeOvertimeEntryRequest(
  where: Prisma.EmployeeOvertimeEntryRequestWhereUniqueInput
) {
  try {
    return await prisma.employeeOvertimeEntryRequest.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee overtime entry request is in use',
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
  include?: Prisma.EmployeeOvertimeEntryRequestInclude;
}): Promise<EmployeeOvertimeEntryRequest> {
  const { id, cancelledByEmployeeId, include } = params;    

  return await prisma.employeeOvertimeEntryRequest.update({ 
    where: { id }, 
    data: {
      status: Status.CANCELLED,
      cancelledAt: new Date(),
      cancelledByEmployee: { connect: { id: cancelledByEmployeeId } },
    },
    include,
  });
}

export async function respond(params: {
  id: number;
  data: EmployeeOvertimeEntryInputDto & { 
    approvingEmployeeId: number, 
    finalApproval: boolean,
    approverLevel: number
  };
  include?: Prisma.EmployeeOvertimeEntryRequestInclude,
}): Promise<EmployeeOvertimeEntryRequestDto> {
  const { id, data, include } = params;
  
  let requestStatus: Status | undefined,
    responseType: ResponseType;
  switch (data.action) {
    case EmployeeOvertimeEntryAction.APPROVE:
      requestStatus = data.finalApproval
        ? Status.APPROVED
        : undefined;
      responseType = Status.APPROVED;
      break;
    case EmployeeOvertimeEntryAction.DECLINE:
      requestStatus = Status.DECLINED;
      responseType = ResponseType.DECLINED;
      break;
    default:
      throw new InputError({ message: 'Invalid Employee overtime entry response type' });
  }

  try {
    return await prisma.employeeOvertimeEntryRequest.update({
      where: { id },
      data: {
        status: requestStatus,
        responseCompletedAt: requestStatus ? new Date() : undefined,
        employeeOvertimeEntryResponses: {
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
          message: 'Employee overtime entry request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}