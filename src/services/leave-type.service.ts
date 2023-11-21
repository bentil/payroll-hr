import {
  CreateLeaveTypeDto,
  LeaveTypeDto,
  LeaveTypeOrderBy,
  QueryApplicableLeaveTypeDto,
  QueryLeaveTypeDto,
  SearchLeaveTypeDto,
  UpdateLeaveTypeDto
} from '../domain/dto/leave-type.dto';
import * as repository from '../repositories/leave-type';
import {
  FailedDependencyError,
  HttpError,
  NotFoundError,
  ServerError
} from '../errors/http-errors';
import { rootLogger } from '../utils/logger';
import * as helpers from '../utils/helpers';
import { CompanyLevelLeavePackage, LeaveType } from '@prisma/client';
import { ListWithPagination } from '../repositories/types';
// eslint-disable-next-line max-len
import * as compLevelLeavePackageRepository from '../repositories/company-level-leave-package.repository';
import * as employeeRepository from '../repositories/employee.repository';
import { UnauthorizedError } from '../errors/unauthorized-errors';
import * as leaveTypeRepository from '../repositories/leave-type';

const logger = rootLogger.child({ context: 'LeaveTypeService' });

export const createLeaveType = async (
  createLeaveTypeDto: CreateLeaveTypeDto,
): Promise<LeaveTypeDto> => {
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

export async function updateLeaveType(
  id: number,
  updateLeaveTypeDto: UpdateLeaveTypeDto,
): Promise<LeaveTypeDto> {
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

}

export async function getLeaveTypes(
  query: QueryLeaveTypeDto
): Promise<ListWithPagination<LeaveType>> {
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
}

export async function getApplicableLeaveTypes(
  query: QueryApplicableLeaveTypeDto
): Promise<ListWithPagination<LeaveTypeDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId,
    companyLevelId,
  } = query;
  const skip = helpers.getSkip(page || 1, take);
  const orderByInput = helpers.getOrderByInput(orderBy || LeaveTypeOrderBy.CREATED_AT_ASC);

  let leaveType: ListWithPagination<LeaveTypeDto>;
  try {
    if (employeeId) {
      const employee = await employeeRepository.findOne({ id: employeeId }, true);
      if (employee?.majorGradeLevel?.companyLevelId) {
        const companyLevelId = employee?.majorGradeLevel?.companyLevelId;
        leaveType = await leaveTypeRepository.find({
          skip,
          take,
          where: { leavePackages: { some: { 
            companyLevelLeavePackages: { some: { companyLevelId } } } 
          } },
          orderBy: orderByInput
        });
      } else {
        throw new UnauthorizedError({});
      }
    } else if (companyLevelId) {
      leaveType = await leaveTypeRepository.find({
        skip,
        take,
        where:{ leavePackages: { some: { 
          companyLevelLeavePackages: { some: { companyLevelId } } } 
        } },
        orderBy: orderByInput
      });
    } else {
      throw new UnauthorizedError({});
    }
  } catch (err) {
    logger.warn(
      'Querying leaveTypes with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return leaveType;
}

export async function getLeaveTypeById(id: number): Promise<LeaveType> {
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
}

export async function searchLeaveTypes(
  query: SearchLeaveTypeDto
): Promise<ListWithPagination<LeaveType>> {
  const {
    page,
    limit: take,
    orderBy,
    q: searchParam
  } = query;

  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let leaveType: ListWithPagination<LeaveType>;
  logger.debug('Finding Leave Type(s) that match search query', { query });
  try {
    leaveType = await repository.search({
      skip,
      take,
      orderBy: orderByInput
    }, searchParam);

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
}

export const deleteLeaveType = async (id: number): Promise<LeaveType> => {
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

// //move to leave type
export async function validate(leaveTypeId: number, employeeId?: number): Promise<number> {
  ///add a consumer for grade level, add the relation grade
  let leavePackage: CompanyLevelLeavePackage | null;
  const employee = await employeeRepository.findOne({ id: employeeId }, true);
  if (employeeId) {
    if (employee?.majorGradeLevel?.companyLevelId) {
      try {
        leavePackage = await compLevelLeavePackageRepository.findFirst({
          leavePackage: { leaveTypeId },
          companyLevelId: employee?.majorGradeLevel?.companyLevelId
        });
      } catch (err) {
        logger.warn('Getting LeavePackage for Employee[%s] with MajorGradeLevel[%s] failed',
          employee, employee.majorGradeLevelId, { error: (err as Error).stack });
        throw new ServerError({ message: (err as Error).message, cause: err });
      }
    } else {
      throw new UnauthorizedError({ message: 'employee does not exist or has no grade level' });
    }
  } else {
    try {
      leavePackage = await compLevelLeavePackageRepository.findFirst({
        leavePackage: { leaveTypeId },
      });
    } catch (err) {
      logger.warn('Getting LeavePackage failed', { error: (err as Error).stack });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
  }

  if (!leavePackage) {
    logger.warn('LeavePackage does not exist for Employee[%s] or leaveType[%s]',
      employee, leaveTypeId);
    throw new FailedDependencyError({ 
      message: 'the leave package either does not exist or is not available for the employee '+
        'or leaveType' 
    });
  }
  return leavePackage.leavePackageId;
} 