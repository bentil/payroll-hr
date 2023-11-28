import {
  CreateLeavePackageDto,
  LeavePackageDto,
  LeavePackageOrderBy,
  QueryLeavePackageDto,
  SearchLeavePackageDto,
  UpdateLeavePackageDto
} from '../domain/dto/leave-package.dto';
import * as repository from '../repositories/leave-package';
import { HttpError, NotFoundError, ServerError } from '../errors/http-errors';
import { rootLogger } from '../utils/logger';
import * as helpers from '../utils/helpers';
import { LeavePackage, Prisma } from '@prisma/client';
import * as payrollCompanyService from '../services/payroll-company.service';
import * as leaveTypeservice from './leave-type.service';
import * as companyLevelService from './company-level.service';
import * as employeeRepository from '../repositories/employee.repository';
import { errors } from '../utils/constants';
import { IncludeCompanyLevelsQueryDto } from '../domain/dto/leave-type.dto';
import { ListWithPagination } from '../repositories/types';
import { AuthorizedUser } from '../domain/user.domain';

const logger = rootLogger.child({ context: 'LeavePackageService' });

export const createLeavePackage = async (
  createLeavePackageDto: CreateLeavePackageDto, authorizedUser: AuthorizedUser
): Promise<LeavePackageDto> => {
  const { companyId, leaveTypeId, companyLevelIds } = createLeavePackageDto;
  const { organizationId } = authorizedUser;

  logger.debug('Validating Payroll Company[%s] and Leave Type[%s]', companyId, leaveTypeId);
  try {
    await Promise.all([
      payrollCompanyService.validatePayrollCompany(
        companyId, { throwOnNotActive: true, organizationId }
      ),
      leaveTypeservice.getLeaveTypeById(leaveTypeId)
    ]);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error(
      'Validating company info and/or leave type for Leave Package creation failed',
      { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  logger.info('Successfully validated Payroll Company and Leave Type');

  logger.debug('Persisting new Leave Package...');
  let leavePackage: LeavePackageDto | null /*validateCompanyLevels: void*/;

  if (companyLevelIds) {
    try {
      await companyLevelService.validateCompanyLevels(companyLevelIds),
      leavePackage = await repository.createLeavePackageWithCompanyLevels(
        createLeavePackageDto,
        {
          leaveType: true,
          companyLevelLeavePackages: {
            include: {
              companyLevel: true,
            }
          },
        }
      );

      if (!leavePackage) {
        logger.error('Persisting LeavePackage with companyLevelIds for company[%s]', companyId);
        throw new ServerError({
          message: 'Persistin LeavePackage with companyLevelIds for company failed'+ companyId
        });
      }
      logger.info('LeavePackage[%s] with companyLevelIds persisted successfully!', leavePackage.id);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      logger.error('Persisting Leave Package with companyLevelIds failed', { error: err });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    return leavePackage;
  }
  else {
    try {
      leavePackage = await repository.create(createLeavePackageDto, {
        leaveType: true
      });
      logger.info('Leave Package[%s] persisted successfully!', leavePackage.id);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      logger.error('Persisting Leave Package failed', { error: err });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    return leavePackage;
  }
};

export const updateLeavePackage = async (id: number,
  updateLeavePackageDto: UpdateLeavePackageDto,
): Promise<LeavePackageDto> => {

  const leavePackage = await repository.findOne({ id });
  if (!leavePackage) {
    logger.warn('LeavePackage[%s] to update does not exist', id);
    throw new NotFoundError({ message: 'Leave Package to update does not exist' });
  }
  const updatedLeavePackage = await repository.update({
    where: { id },
    data: updateLeavePackageDto,
    include: {
      leaveType: true
    }
  });

  logger.info('Update(s) to LeavePackage[%s] persisted successfully!', id);
  return updatedLeavePackage;
};

export const getLeavePackages = async (
  query: QueryLeavePackageDto,
): Promise<ListWithPagination<LeavePackageDto>> => {
  const {
    page,
    limit: take,
    orderBy,
    ...queryParam
  } = query;
  const skip = helpers.getSkip(page || 1, take);
  const orderByInput = helpers.getOrderByInput(orderBy || LeavePackageOrderBy.CREATED_AT_ASC);
 

  let leavePackage: ListWithPagination<LeavePackageDto>;
  logger.debug('Finding LeavePackage(s) that match query', { query });
  try {
    leavePackage = await repository.find({
      skip,
      take,
      where: { ...queryParam },
      include: {
        leaveType: true
      },
      orderBy: orderByInput
    });
    logger.info(
      'Found %d LeavePackage that matched query',
      leavePackage.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying leavePackages with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return leavePackage;
};

export const getLeavePackageById = async (
  id: number,
  includeCompanyLevelsQueryDto: IncludeCompanyLevelsQueryDto,
): Promise<LeavePackageDto> => {
  const { includeCompanyLevels } = includeCompanyLevelsQueryDto;
  logger.debug('Getting details for Leave Package[%s]', id);

  let include: Prisma.LeavePackageInclude;
  if (includeCompanyLevels === true) {
    include = {
      companyLevelLeavePackages: {
        include: {
          companyLevel: true
        }
      },
      leaveType: true
    };
  } else {
    include = {
      companyLevelLeavePackages: false,
      leaveType: true
    };
  }

  let leavePackage: LeavePackageDto | null;
  try {
    leavePackage = await repository.findOne({ id },
      include);
  } catch (err) {
    logger.warn('Getting Leave Package[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leavePackage) {
    logger.warn('Leave Package[%s] does not exist', id);
    throw new NotFoundError({ message: 'Leave Package does not exist' });
  }
  logger.info('Leave Package[%s] details retrieved!', id);
  return leavePackage;
};

export async function getApplicableLeavePackage(
  employeeId: number, leaveTypeId: number
): Promise<LeavePackageDto> {
  logger.debug('Getting applicable leave package for employee[%s] for leaveType[%s]',
    employeeId, leaveTypeId);

  let leavePackage: LeavePackageDto | null;
  try {
    const employee = await employeeRepository.findOne({ id: employeeId }, true);
    if (employee?.majorGradeLevel?.companyLevelId) {
      const companyLevelId = employee?.majorGradeLevel?.companyLevelId;
      leavePackage = await repository.findFirst({
        leaveTypeId,
        companyLevelLeavePackages:  { some: { companyLevelId } 
        } 
      });
    } else {
      leavePackage = null;
    }
  } catch (err) {
    logger.warn('Getting applicable Leave Packagefor employee[%s] for leaveType[%s]', 
      employeeId, leaveTypeId, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!leavePackage) {
    logger.warn('Getting applicable Leave Packagefor employee[%s] for leaveType[%s]', 
      employeeId, leaveTypeId,);
    throw new NotFoundError({ message: 'Leave Package does not exist' });
  }

  return leavePackage;
}

export const searchLeavePackages = async (
  query: SearchLeavePackageDto,
): Promise<ListWithPagination<LeavePackageDto>> => {
  const {
    page,
    limit: take,
    orderBy,
    q: searchParam
  } = query;

  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let leavePackage: ListWithPagination<LeavePackageDto>;
  logger.debug('Finding Leave Package(s) that match search query', { query });
  try {
    leavePackage = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      include: {
        leaveType: true
      },
    }, searchParam);

    logger.info('Found %d LeavePackage that matched search query',
      leavePackage.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying leavePackages with search query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  return leavePackage;
};

export const deleteLeavePackage = async (
  id: number,
): Promise<void> => {
  logger.debug('Getting details for LeavePackage[%s]', id);
  let leavePackage: LeavePackage | null;
  try {
    leavePackage = await repository.findOne({ id });
    logger.info('LeavePackage[%s] details retrieved!', id);

    if (!leavePackage) {
      logger.warn('LeavePackage[%s] does not exist', id);
      throw new NotFoundError({
        message: 'LeavePackage you are attempting to delete does not exist'
      });
    }
    await repository.deleteOne({ id });
    logger.info('LeavePackage[%s] successfully deleted!', id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn('Deleting LeavePackage[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
};


// export async function validateLeavePackageIds(
//   leavePackageIds: number[]
// ): Promise<void> {
//   const distinctIds = new Set<number>(leavePackageIds);
//   const foundLeavePackageIds = await repository.find({
//     where: { id: { in: [...distinctIds] } }
//   });

//   if (foundLeavePackageIds.data.length !== distinctIds.size) {
//     logger.warn(
//       'Received %d leavePackage id(s), but found %d',
//       distinctIds.size, foundLeavePackageIds.data.length
//     );
//     throw new NotFoundError({
//       name: errors.LEAVE_PACKAGE_NOT_FOUND,
//       message: 'At least one leave package ID passed does not exist for company'
//     });
//   }
// }

export async function validateLeavePackageIds(
  leavePackageIds: number[],
  options?: {
    companyId?: number, companyIds?: number[],
  }
): Promise<void> {

  const distinctCompanyIds = new Set<number>(options?.companyIds);
  let companyIdQuery: {
    companyId?: number | { in: number[] };
  };
  if (options?.companyId) {
    companyIdQuery = {
      companyId: options?.companyId
    };
  } else {
    companyIdQuery = {
      companyId: { in: [...distinctCompanyIds] }
    };
  }

  const distinctIds = new Set<number>(leavePackageIds);
  const foundLeavePackageIds = await repository.find({
    where: {
      id: { in: [...distinctIds] },
      ...companyIdQuery,
    }
  });

  if (foundLeavePackageIds.data.length !== distinctIds.size) {
    logger.warn(
      'Received %d leavePackage id(s), but found %d',
      distinctIds.size, foundLeavePackageIds.data.length
    );
    throw new NotFoundError({
      name: errors.LEAVE_PACKAGE_NOT_FOUND,
      message: 'At least one leave package ID passed does not exist for company'
    });
  }
}
