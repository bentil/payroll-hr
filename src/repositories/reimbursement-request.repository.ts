import { 
  Prisma, 
  REIMBURESEMENT_REQUEST_STATE, 
  REIMBURESEMENT_REQUEST_STATUS, 
  ReimbursementRequest 
} from '@prisma/client';
import { 
  CompleteReimbursementRequestDto,
  CreateReimbursementRequestDto, 
  REIMBURSEMENT_RESPONSE_ACTION, 
  ReimbursementRequestDto, 
  ReimbursementRequestUpdatesDto, 
  ReimbursementResponseInputDto
} from '../domain/dto/reimbursement-request.dto';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, FailedDependencyError, InputError } from '../errors/http-errors';
import * as helpers from '../utils/helpers';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  { employeeId, currencyId, ...dtoData }: CreateReimbursementRequestDto,
  approvingEmployeeId?: number
): Promise<ReimbursementRequest> {
  const data: Prisma.ReimbursementRequestCreateInput = {
    ...dtoData,
    approver: approvingEmployeeId? { connect: { id: approvingEmployeeId } } : undefined,
    employee: { connect: { id: employeeId } },
    currency: { connect: { id: currencyId } },
  };
  try {
    return await prisma.reimbursementRequest.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function CreateReimbursementReqWithAttachment(
  { employeeId, currencyId, attachmentUrls, ...dtoData }: CreateReimbursementRequestDto
): Promise<ReimbursementRequest> {
  if (!attachmentUrls) {
    throw new FailedDependencyError({
      message: 'Dependency check(s) failed',
    });
  }
  const attachments = helpers.generateReimbursementAttachments(attachmentUrls, employeeId);
    
  const data: Prisma.ReimbursementRequestCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    currency: { connect: { id: currencyId } },
    requestAttachments: {
      createMany: {
        data: attachments
      }
    }
  };

  try {
    return await prisma.reimbursementRequest.create({ data });    
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  where: Prisma.ReimbursementRequestWhereUniqueInput,
  include?: Prisma.ReimbursementRequestInclude,
): Promise<ReimbursementRequestDto | null> {
  return await prisma.reimbursementRequest.findUnique({ where, include });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.ReimbursementRequestWhereInput,
  orderBy?: Prisma.ReimbursementRequestOrderByWithRelationAndSearchRelevanceInput,
  include: Prisma.ReimbursementRequestInclude,
}): Promise<ListWithPagination<ReimbursementRequestDto>> {
  const { skip, take, include } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.reimbursementRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include
    }),
    paginate 
      ? prisma.reimbursementRequest.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export const findFirst = async (
  where: Prisma.ReimbursementRequestWhereInput,
): Promise<ReimbursementRequestDto | null> => {
  return prisma.reimbursementRequest.findFirst({ where });
};

export async function update(params: {
  where: Prisma.ReimbursementRequestWhereUniqueInput,
  data: Prisma.ReimbursementRequestUpdateInput,
  include?: Prisma.ReimbursementRequestInclude,
}) {
  const { where, data, include } = params;
  try {
    return await prisma.reimbursementRequest.update({ 
      where, 
      data,
      include
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function respond(params: {
  id: number;
  data: ReimbursementResponseInputDto & { approvingEmployeeId: number, approvedAt?: Date };
  include: Prisma.ReimbursementRequestInclude,
}): Promise<ReimbursementRequestDto> {
  // how is approverId supposed to be assigned
  const { id, data, include } = params;
  
  let requestStatus: REIMBURESEMENT_REQUEST_STATUS, requestState: REIMBURESEMENT_REQUEST_STATE;
  switch (data.action) {
  case REIMBURSEMENT_RESPONSE_ACTION.APPROVE:
    requestStatus = REIMBURESEMENT_REQUEST_STATUS.APPROVED;
    requestState = REIMBURESEMENT_REQUEST_STATE.APPROVAL;
    break;
  case REIMBURSEMENT_RESPONSE_ACTION.REJECT:
    requestStatus = REIMBURESEMENT_REQUEST_STATUS.REJECTED;
    requestState = REIMBURESEMENT_REQUEST_STATE.APPROVAL;
    break;
  case REIMBURSEMENT_RESPONSE_ACTION.QUERY:
    requestStatus = REIMBURESEMENT_REQUEST_STATUS.QUERIED;
    requestState = REIMBURESEMENT_REQUEST_STATE.QUERY;
    break;
  default:
    throw new InputError({ message: 'Invalid reimbursement response type' });
  }

  try {
    return await prisma.$transaction(async (txn) => {
      const reimbursementRequest = await txn.reimbursementRequest.update({
        where: { id },
        data: {
          status: requestStatus,
          statusLastModifiedAt: new Date(),
          approvedAt: data.approvedAt,
          approverId: data.approvingEmployeeId,
        },
        include
      });

      if (data.attachmentUrls) {
        const attachments = helpers.genReimbAttachmentsWithReqId(
          data.attachmentUrls, data.approvingEmployeeId, id
        );
    
        await txn.reimbursementRequestAttachment.createMany({
          data: attachments
        });
        
      }

      if (data.comment) {
        await txn.reimbursementRequestComment.create({
          data: {
            requestId: id,
            commenterId: data.approvingEmployeeId,
            comment: data.comment,
            requestState
          }
        });
      }

      return reimbursementRequest;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function postUpdate(params: {
  id: number;
  data: ReimbursementRequestUpdatesDto & { updatingEmployeeId: number };
  include: Prisma.ReimbursementRequestInclude;
}): Promise<ReimbursementRequestDto | null> {
  //what should be returned for the post update
  const { id, data, include } = params;

  try {
    return await prisma.$transaction(async (txn) => {
      const reimbRequest = await txn.reimbursementRequest.findUnique({ where: { id }, include });

      if (data.attachmentUrls) {
        const attachments = helpers.genReimbAttachmentsWithReqId(
          data.attachmentUrls, data.updatingEmployeeId, id
        );
    
        await txn.reimbursementRequestAttachment.createMany({
          data: attachments
        });
        
      }

      if (data.comment) {
        await txn.reimbursementRequestComment.create({
          data: {
            requestId: id,
            commenterId: data.updatingEmployeeId,
            comment: data.comment,
            requestState: REIMBURESEMENT_REQUEST_STATE.QUERY
          }
        });
      }
      
      return reimbRequest;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement comment or attachment already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function completeRequest(params: {
  id: number;
  data: CompleteReimbursementRequestDto & { completingEmployeeId: number };
  include: Prisma.ReimbursementRequestInclude;
}): Promise<ReimbursementRequestDto> {
  const { id, data, include } = params;

  try {
    return await prisma.$transaction(async (txn) => {
      const reimbursementRequest = await txn.reimbursementRequest.update({
        where: { id },
        data: {
          status: REIMBURESEMENT_REQUEST_STATUS.APPROVED,
          completerId: data.completingEmployeeId,
          statusLastModifiedAt: new Date(),
          completedAt: new Date()
        },
        include
      });

      if (data.comment) {
        await txn.reimbursementRequestComment.create({
          data: {
            requestId: id,
            commenterId: data.completingEmployeeId,
            comment: data.comment,
            requestState: REIMBURESEMENT_REQUEST_STATE.COMPLETION
          }
        });
      }

      return reimbursementRequest;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Reimbursement request already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}