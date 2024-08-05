import { 
  Prisma, 
  REIMBURESEMENT_REQUEST_STATE, 
  REIMBURESEMENT_REQUEST_STATUS, 
  ReimbursementRequest, 
  ReimbursementRequestComment
} from '@prisma/client';
import { prisma } from '../components/db.component';
import { 
  CompleteReimbursementRequestDto,
  CreateReimbursementRequestDto, 
  ReimbursementResponseAction, 
  ReimbursementRequestDto, 
  ReimbursementRequestUpdatesDto, 
  ReimbursementResponseInputDto
} from '../domain/dto/reimbursement-request.dto';
import {
  AlreadyExistsError,
  InputError,
  RecordInUse
} from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';


export async function create(
  { employeeId, currencyId, attachmentUrls, ...dtoData }: CreateReimbursementRequestDto & {
    approvalsRequired?: number
  }
): Promise<ReimbursementRequest> {
  try {
    return await prisma.reimbursementRequest.create({ 
      data: {
        ...dtoData,
        employee: { connect: { id: employeeId } },
        currency: { connect: { id: currencyId } },
        requestAttachments: attachmentUrls && {
          createMany: { 
            data: attachmentUrls.map(
              (attachmentUrl) => { 
                return { attachmentUrl, uploaderId: employeeId };
              }
            )
          }
        } 
      }
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
  include: Prisma.ReimbursementRequestInclude
): Promise<ReimbursementRequestDto | null> => {
  return prisma.reimbursementRequest.findFirst({ where, include });
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
  data: ReimbursementResponseInputDto & { 
    approvingEmployeeId: number, 
    finalApproval: boolean,
    approverLevel?: number
  };
  include: Prisma.ReimbursementRequestInclude,
}): Promise<ReimbursementRequestDto> {
  // how is approverId supposed to be assigned
  const { id, data, include } = params;
  
  let requestStatus: REIMBURESEMENT_REQUEST_STATUS | undefined, 
    requestState: REIMBURESEMENT_REQUEST_STATE;
  switch (data.action) {
  case ReimbursementResponseAction.APPROVE:
    requestStatus = data.finalApproval ? REIMBURESEMENT_REQUEST_STATUS.APPROVED : undefined;
    requestState = REIMBURESEMENT_REQUEST_STATE.APPROVAL;
    break;
  case ReimbursementResponseAction.REJECT:
    requestStatus = REIMBURESEMENT_REQUEST_STATUS.REJECTED;
    requestState = REIMBURESEMENT_REQUEST_STATE.REJECTION;
    break;
  case ReimbursementResponseAction.QUERY:
    requestStatus = REIMBURESEMENT_REQUEST_STATUS.QUERIED;
    requestState = REIMBURESEMENT_REQUEST_STATE.QUERY;
    break;
  default:
    throw new InputError({ message: 'Invalid reimbursement response type' });
  }

  try {
    return await prisma.reimbursementRequest.update({
      where: { id },
      data: {
        status: requestStatus,
        statusLastModifiedAt: requestStatus ? new Date() : undefined,
        approvedAt: requestStatus === REIMBURESEMENT_REQUEST_STATUS.APPROVED 
          ? new Date() : undefined,
        approverId: data.approvingEmployeeId,
        requestAttachments: data.attachmentUrls && {
          createMany: { 
            data: data.attachmentUrls.map(
              (attachmentUrl) => { 
                return { attachmentUrl, uploaderId: data.approvingEmployeeId };
              }
            )
          }
        },
        requestComments: data.comment ? {
          create: {
            commenterId: data.approvingEmployeeId,
            comment: data.comment,
            requestState,
            approverLevel: data.approverLevel
          }
        } : undefined
      },
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

export async function postUpdate(params: {
  id: number;
  data: ReimbursementRequestUpdatesDto & { updatingEmployeeId: number };
  include: Prisma.ReimbursementRequestInclude;
}): Promise<ReimbursementRequestDto | null> {
  const { id, data, include } = params;

  try {
    return await prisma.reimbursementRequest.update({
      where: { id },
      data: {
        requestAttachments: data.attachmentUrls && {
          createMany: { 
            data: data.attachmentUrls.map(
              (attachmentUrl) => { 
                return { attachmentUrl, uploaderId: data.updatingEmployeeId };
              }
            )
          }
        },
        requestComments: data.comment ? {
          create: {
            commenterId: data.updatingEmployeeId,
            comment: data.comment,
            requestState: REIMBURESEMENT_REQUEST_STATE.QUERY
          }
        } : undefined
      },
      include
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
    return await prisma.reimbursementRequest.update({
      where: { id },
      data: {
        status: REIMBURESEMENT_REQUEST_STATUS.COMPLETED,
        completerId: data.completingEmployeeId,
        statusLastModifiedAt: new Date(),
        completedAt: new Date(),
        requestComments: data.comment ? {
          create: {
            commenterId: data.completingEmployeeId,
            comment: data.comment,
            requestState: REIMBURESEMENT_REQUEST_STATE.COMPLETION
          }
        } : undefined
      },
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

export async function search(params: {
  skip?: number,
  take?: number,
  where: Prisma.ReimbursementRequestWhereInput,
  include?: Prisma.ReimbursementRequestInclude,
  orderBy?: Prisma.ReimbursementRequestOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<ReimbursementRequest>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.reimbursementRequest.findMany(params),
    paginate 
      ? prisma.reimbursementRequest.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOne(
  where: Prisma.ReimbursementRequestWhereUniqueInput
): Promise<ReimbursementRequest> {
  try {
    return await prisma.reimbursementRequest.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Reimbursement request is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findFirstComment(params: {
  where: Prisma.ReimbursementRequestCommentWhereInput,
  orderBy?: Prisma.ReimbursementRequestCommentOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.ReimbursementRequestCommentInclude,
}): Promise<ReimbursementRequestComment | null>  {
  return prisma.reimbursementRequestComment.findFirst(params);
}

export async function findLastComment(
  where: Prisma.ReimbursementRequestCommentWhereInput,
  include?: Prisma.ReimbursementRequestCommentInclude
): Promise<ReimbursementRequestComment | null> {
  return await findFirstComment({ 
    where, 
    orderBy: { id: 'desc' },
    include 
  });
}