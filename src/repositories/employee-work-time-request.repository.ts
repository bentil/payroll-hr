import { 
  EmployeeWorkTimeRequest, 
  EmployeeWorkTimeResponse, 
  Prisma, 
  ResponseType, 
  Status 
} from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, InputError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  CreateEmployeeWorkTimeRequestDto, 
  EmployeeWorkTimeAction, 
  EmployeeWorkTimeInputDto, 
  EmployeeWorkTimeRequestDto 
} from '../domain/dto/employee-work-time-request.dto';

export async function create(
  { employeeId, payPeriodId, ...dtoData }: CreateEmployeeWorkTimeRequestDto,
  include?: Prisma.EmployeeWorkTimeRequestInclude,
): Promise<EmployeeWorkTimeRequestDto> {
  const data: Prisma.EmployeeWorkTimeRequestCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    payPeriod: { connect: { id: payPeriodId } }
  };

  try {
    return await prisma.employeeWorkTimeRequest.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee work time request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeWorkTimeRequestWhereUniqueInput,
  include?: Prisma.EmployeeWorkTimeRequestInclude,
): Promise<EmployeeWorkTimeRequest | null> {
  return await prisma.employeeWorkTimeRequest.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeWorkTimeRequestWhereInput,
  orderBy?: Prisma.EmployeeWorkTimeRequestOrderByWithRelationAndSearchRelevanceInput
  include?: Prisma.EmployeeWorkTimeRequestInclude,
}): Promise<ListWithPagination<EmployeeWorkTimeRequest>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeWorkTimeRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate 
      ? prisma.employeeWorkTimeRequest.count({ where: params.where }) : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
  
}

export async function findFirst(
  where: Prisma.EmployeeWorkTimeRequestWhereInput,
  include?: Prisma.EmployeeWorkTimeRequestInclude,
): Promise<EmployeeWorkTimeRequestDto | null> {
  return prisma.employeeWorkTimeRequest.findFirst({ where, include });
}

export async function findResponse(params: {
  skip?: number;
  take?: number;
  where?: Prisma.EmployeeWorkTimeResponseWhereInput;
  orderBy?: Prisma.EmployeeWorkTimeResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.EmployeeWorkTimeResponseInclude;
}): Promise<EmployeeWorkTimeResponse[]> {
  const data = await prisma.employeeWorkTimeResponse.findMany(params);

  return data;
}

export async function findFirstResponse(params: {
  where: Prisma.EmployeeWorkTimeResponseWhereInput;
  orderBy?: Prisma.EmployeeWorkTimeResponseOrderByWithRelationAndSearchRelevanceInput;
  include?: Prisma.EmployeeWorkTimeResponseInclude;
}): Promise<EmployeeWorkTimeResponse | null> {
  return prisma.employeeWorkTimeResponse.findFirst(params);
}

export async function findLastResponse(
  where: Prisma.EmployeeWorkTimeResponseWhereInput,
  include?: Prisma.EmployeeWorkTimeResponseInclude
): Promise<EmployeeWorkTimeResponse | null> {
  return await findFirstResponse({ 
    where, 
    orderBy: { id: 'desc' },
    include 
  });
}

export async function update(params: {
  where: Prisma.EmployeeWorkTimeRequestWhereUniqueInput,
  data: Prisma.EmployeeWorkTimeRequestUpdateInput,
  include?: Prisma.EmployeeWorkTimeRequestInclude,
}) {
  const { where, data, include } = params;
  try {
    return await prisma.employeeWorkTimeRequest.update({ 
      where, 
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee work time request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteEmployeeWorkTimeRequest(
  where: Prisma.EmployeeWorkTimeRequestWhereUniqueInput
) {
  try {
    return await prisma.employeeWorkTimeRequest.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee work time request is in use',
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
  include?: Prisma.EmployeeWorkTimeRequestInclude;
}): Promise<EmployeeWorkTimeRequestDto> {
  const { id, cancelledByEmployeeId, include } = params;    

  return await prisma.employeeWorkTimeRequest.update({ 
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
  data: EmployeeWorkTimeInputDto & { 
    approvingEmployeeId: number, 
    finalApproval: boolean,
    approverLevel: number
  };
  include?: Prisma.EmployeeWorkTimeRequestInclude,
}): Promise<EmployeeWorkTimeRequestDto> {
  const { id, data, include } = params;
  
  let requestStatus: Status | undefined,
    responseType: ResponseType;
  switch (data.action) {
    case EmployeeWorkTimeAction.APPROVE:
      requestStatus = data.finalApproval
        ? Status.APPROVED
        : undefined;
      responseType = Status.APPROVED;
      break;
    case EmployeeWorkTimeAction.DECLINE:
      requestStatus = Status.DECLINED;
      responseType = ResponseType.DECLINED;
      break;
    default:
      throw new InputError({ message: 'Invalid Employee work time response type' });
  }

  try {
    return await prisma.employeeWorkTimeRequest.update({
      where: { id },
      data: {
        status: requestStatus,
        responseCompletedAt: requestStatus ? new Date() : undefined,
        employeeWorkTimeResponses: {
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
          message: 'Employee work time request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}