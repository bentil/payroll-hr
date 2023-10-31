import {
  CreateLeaveTypeDto,
  LeaveTypeDto,
  LeaveTypeOrderBy,
  QueryLeaveTypeDto,
  SearchLeaveTypeDto,
  UpdateLeaveTypeDto
} from '../domain/dto/leave-type.dto';
import { AuthorizedUser } from '../domain/user.domain';
import * as repository from '../repositories/leave-type';
import {
  ForbiddenError,
  HttpError,
  NotFoundError,
  ServerError
} from '../errors/http-errors';
import { rootLogger } from '../utils/logger';
import { managePermissionScopeQuery } from '../utils/helpers';
import * as helpers from '../utils/helpers';
import { LeaveType } from '@prisma/client';
import { ListWithPagination } from '../repositories/types';

const logger = rootLogger.child({ context: 'LeaveTypeService' });

export const createLeaveType = async (
  createLeaveTypeDto: CreateLeaveTypeDto,
  authorizedUser: AuthorizedUser
): Promise<LeaveTypeDto> => {
  const { platformUser } = authorizedUser;
  if (platformUser === false) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }

  logger.debug('Persisting new Leave Type...');
  let leaveType: LeaveTypeDto;
  try {
    leaveType = await repository.create(createLeaveTypeDto);
    logger.info('Leave Type[%s] persisted successfully!', leaveType.id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting Leave Type failed', { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return leaveType;
};

export const updateLeaveType = async (
  id: number,
  updateLeaveTypeDto: UpdateLeaveTypeDto,
  authorizedUser: AuthorizedUser
): Promise<LeaveTypeDto> => {
  const { platformUser } = authorizedUser;
  if (platformUser === false) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }
  const leaveType = await repository.findOne({ id });
  if (!leaveType) {
    logger.warn('LeaveType[%s] to update does not exist', id);
    throw new NotFoundError({ message: 'Leave Type to update does not exist' });
  }
  const updatedLeaveType = await repository.update({
    where: { id },
    data: updateLeaveTypeDto
  });

  logger.info('Update(s) to LeaveType[%s] persisted successfully!', id);
  return updatedLeaveType;

};

export const getLeaveTypes = async (
  query: QueryLeaveTypeDto,
  //authorizedUser: AuthorizedUser
): Promise<ListWithPagination<LeaveType>> => {
  const {
    page,
    limit: take,
    orderBy,
    ...queryParam
  } = query;
  const skip = helpers.getSkip(page || 1, take);
  const orderByInput = helpers.getOrderByInput(orderBy || LeaveTypeOrderBy.CREATED_AT_ASC);

  let leaveType: ListWithPagination<LeaveType>;
  logger.debug('Finding LeaveType(s) that match query', { query });
  try {
    leaveType = await repository.find({
      skip,
      take,
      where: {
        ...queryParam
      },
      orderBy: orderByInput
    });
    logger.info(
      'Found %d LeaveType that matched query',
      leaveType.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying leaveTypes with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return leaveType;
};

export const getLeaveTypeById = async (
  id: number,
  //authorizedUser: AuthorizedUser
): Promise<LeaveType> => {
  logger.debug('Getting details for LeaveType[%s]', id);

  let leaveType: LeaveType | null;
  try {
    leaveType = await repository.findOne({ id });
  } catch (err) {
    logger.warn('Getting Leave Type[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leaveType) {
    logger.warn('Leave Type[%s] does not exist', id);
    throw new NotFoundError({ message: 'Leave Type does not exist' });
  }
  logger.info('Leave Type[%s] details retrieved!', id);
  return leaveType;
};

export const searchLeaveTypes = async (
  query: SearchLeaveTypeDto,
  authorizedUser: AuthorizedUser
): Promise<ListWithPagination<LeaveType>> => {
  const {
    page,
    limit: take,
    orderBy,
    q: searchParam
  } = query;

  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await managePermissionScopeQuery(authorizedUser,
    { queryParam: {} });

  let leaveType: ListWithPagination<LeaveType>;
  logger.debug('Finding Leave Type(s) that match search query', { query });
  try {
    leaveType = await repository.search({
      skip,
      take,
      orderBy: orderByInput
    }, searchParam, scopedQuery);

    logger.info(
      'Found %d LeaveType that matched search query',
      leaveType.data.length, { query });
  } catch (err) {
    logger.warn(
      'Querying leaveTypes with search query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return leaveType;
};

export const deleteLeaveType = async (
  id: number,
  authorizedUser: AuthorizedUser
): Promise<LeaveType> => {
  const { platformUser } = authorizedUser;
  if (platformUser === false) {
    throw new ForbiddenError({ message: 'User not allowed to perform action' });
  }

  logger.debug('Getting details for LeaveType[%s]', id);
  let deletedLeaveType: LeaveType | null, leaveType: LeaveType | null;
  try {
    leaveType = await repository.findOne({ id });
    logger.info('LeaveType[%s] details retrieved!', id);

    if (!leaveType) {
      logger.warn('LeaveType[%s] does not exist', id);
      throw new NotFoundError({
        message: 'LeaveType you are attempting to delete does not exist'
      });
    }
    deletedLeaveType = await repository.deleteOne({ id });
    logger.info('LeaveType[%s] successfully deleted!', id);
    return deletedLeaveType;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn('Deleting LeaveType[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
};
