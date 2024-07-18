import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  GetOneEmployeeApproverDto,
  QueryEmployeeApproverDto,
  UpdateEmployeeApproverDto
} from '../domain/dto/employee-approver.dto';
import {
  HttpError,
  NotFoundError,
  RequirementNotMetError,
  ServerError
} from '../errors/http-errors';
import * as repository from '../repositories/employee-approver.repository';
import * as employeeService from './employee.service';
import * as companyTreeService from './company-tree-node.service';
import * as deptLeadershipService from './department-leadership.service';
import { ListWithPagination } from '../repositories/types';
import { rootLogger } from '../utils/logger';
import * as helpers from '../utils/helpers';
import { KafkaService } from '../components/kafka.component';
import { AuthorizedUser } from '../domain/user.domain';
import { EmployeeApprover } from '@prisma/client';
import { errors } from '../utils/constants';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeApproverService' });

const events = {
  created: 'event.EmployeeApprover.created',
  modified: 'event.EmployeeApprover.modified',
  deleted: 'event.EmployeeApprover.deleted'
};

export async function createEmployeeApprover(
  employeeId: number,
  createData: CreateEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<EmployeeApproverDto> {
  const { approverId, level } = createData;
  await helpers.applyEmployeeScopeToQuery(authUser, { employeeId });
  //Validation
  const [employee, approver] = await Promise.all([
    employeeService.validateEmployee(
      employeeId, authUser, { throwOnNotActive: true, includeCompany: true }
    ),
    employeeService.validateEmployee(approverId, authUser, { throwOnNotActive: true })
  ]);
  logger.info('Employee[%s] and Approver[%s] validated successfully', employeeId, approverId);
  if (employee.companyId !== approver.companyId) {
    throw new RequirementNotMetError({
      message: 'Approver and employee are not of same company'
    });
  }

  const employeesCompanyAllowedLevels = Math.max(
    employee.company!.leaveRequestApprovalsRequired, 
    employee.company!.reimbursementRequestApprovalsRequired
  );
  if (level > employeesCompanyAllowedLevels) {
    throw new RequirementNotMetError({
      message: 'Level is greater than allowed'
    });
  }

  logger.debug('Persisting new EmployeeApprover...');
  let employeeApprover: EmployeeApproverDto;
  try {
    employeeApprover = await repository.create({
      ...createData,
      employeeId
    });
    logger.info('EmployeeApprover[%s] persisted successfully!', employeeApprover.id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting EmployeeApprover failed', { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeApprover.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, employeeApprover);
  logger.info(`${events.created} event created successfully!`);

  return employeeApprover;
}

export async function updateEmployeeApprover(
  id: number,
  employeeId: number,
  updateData: UpdateEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<EmployeeApproverDto> {
  const { approverId, level } = updateData;
  logger.info('Getting EmployeeApprover[%s] to update', id);
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
    authUser, { employeeId }
  );
  let employeeApprover: EmployeeApproverDto | null;
  try {
    employeeApprover = await repository.findOne({ id, ...scopedQuery });
  } catch (err) {
    logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  
  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] to update does not exist', id);
    throw new NotFoundError({ 
      message: 'Employee approver to update does not exist' 
    });
  }

  // validating
  if (approverId) {
    await employeeService.validateEmployee(approverId, authUser);
  }

  if (level) {
    const employee = await employeeService.validateEmployee(
      employeeId, authUser, { includeCompany: true }
    );

    const employeesCompanyAllowedLevels = Math.max(
      employee.company!.leaveRequestApprovalsRequired, 
      employee.company!.reimbursementRequestApprovalsRequired
    );
    if (level > employeesCompanyAllowedLevels) {
      throw new RequirementNotMetError({
        message: 'Level is greater than allowed'
      });
    }
  }

  const updatedEmployeeApprover = await repository.update({
    where: { id, employeeId },
    data: updateData
  });

  logger.info('Update(s) to EmployeeApprover[%s] persisted successfully!', id);

  // Emit event.EmployeeApprover.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeApprover);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeApprover;
}

export async function getEmployeeApprovers(
  employeeId: number,
  query: QueryEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<EmployeeApproverDto>> {
  const {
    page,
    limit: take,
    orderBy,
    approverId: queryApprover,
    level,
    inverse,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  let approverId: number | undefined, scopeQuery;
  if (inverse) {
    approverId = employeeId;
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { }
    );
    scopeQuery = scopedQuery;
  } else {
    approverId = queryApprover;
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { employeeId }
    );
    scopeQuery = scopedQuery;
  }

  let result: ListWithPagination<EmployeeApproverDto>;
  logger.debug('Finding EmployeeApprover(s) that match query', { query });
  try {
    result = await repository.find({
      skip,
      take,
      where: {
        ...scopeQuery,
        approverId,
        level
      },
      orderBy: orderByInput,
      include: {
        employee: true,
        approver: true
      }
    });
    logger.info(
      'Found %d EmployeeApprover(s) that matched query',
      result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeApprover with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return result;
}


export async function getEmployeeApproverId(
  id: number,
  employeeId: number,
  query: GetOneEmployeeApproverDto,
  authUser: AuthorizedUser,
): Promise<EmployeeApproverDto> {
  logger.debug('Getting details for EmployeeApprover[%s]', id);
  let approverId: number, employeeApprover: EmployeeApproverDto | null;
  if (query?.inverse) {
    approverId = employeeId;
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { }
    );
    try {
      employeeApprover = await repository.findOne(
        { id, approverId, ...scopedQuery },
        { employee: true, approver: true }
      );
    } catch (err) {
      logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    
  } else {
    const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
      authUser, { employeeId }
    );
    try {
      employeeApprover = await repository.findOne(
        { id, ...scopedQuery },
        { employee: true, approver: true }
      );
    } catch (err) {
      logger.warn('Getting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
      throw new ServerError({ message: (err as Error).message, cause: err });
    }
    
  }  

  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] does not exist', id);
    throw new NotFoundError({ message: 'Employee approver does not exist' });
  }
  logger.info('EmployeeApprover[%s] details retrieved!', id);
  return employeeApprover;
}

export async function deleteEmployeeApprover(
  id: number,
  employeeId: number,
  authUser: AuthorizedUser
): Promise<void> {
  logger.debug('Getting details for EmployeeApprover[%s]', id);
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
    authUser, { employeeId }
  );
  const employeeApprover = await repository.findOne({ id, ...scopedQuery });
  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_APPROVER_NOT_FOUND,
      message: 'Employee approver to remove does not exist'
    });
  }
  logger.info('EmployeeApprover[%s] to remove exists!', id);

  logger.debug('Deleting EmployeeApprover[%s] from database...', id);
  let deletedEmployeeApprover: EmployeeApprover | null;
  try {
    deletedEmployeeApprover = await repository.deleteOne({ id });
    logger.info('EmployeeApprover[%s] successfully deleted!', id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn('Deleting EmployeeApprover[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeApprover.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedEmployeeApprover);
  logger.info(`${events.deleted} event created successfully!`);
}

type EmployeeApproverSummary = Pick<EmployeeApproverDto, 'approverId' | 'employeeId' | 'level'>

export async function getEmployeeApproversWithEmployeeId(
  employeeId: number,
  approvalType?: string,
): Promise<ListWithPagination<EmployeeApproverSummary>> {
  //return approvals highest number or add it but optional
  const employee = await employeeService.getEmployee(employeeId, { includeCompany: true });
  let employeesCompanyAllowdLevels: number;
  if (!approvalType) {
    employeesCompanyAllowdLevels = Math.max(
      employee.company!.leaveRequestApprovalsRequired, 
      employee.company!.reimbursementRequestApprovalsRequired
    );
  } else if (approvalType === 'leave') {
    employeesCompanyAllowdLevels = employee.company!.leaveRequestApprovalsRequired;
  } else {
    employeesCompanyAllowdLevels = employee.company!.reimbursementRequestApprovalsRequired;
  }
  const allowedLevels: number[] =[];
  for (let val = 1; val <=employeesCompanyAllowdLevels; val++) {
    allowedLevels.push(val);
  }
  logger.debug('Getting details for Employee[%s] Approvers', employeeId);
  let employeeApprovers: ListWithPagination<EmployeeApproverSummary>;
  try {
    employeeApprovers = await repository.find({
      where: { employeeId },
      include: { employee: true, approver: true }
    });
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] Approvers failed', employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  //getting levels

  if (employeeApprovers.data.length < allowedLevels.length) {
    const availableLevels = [...new Set(employeeApprovers.data.map((d) => d.level))];
    const unavailableLevels = allowedLevels.filter(i => !availableLevels.includes(i));
    unavailableLevels.forEach(async (x) => {
      if (x === 1) {
        const data = await companyTreeService.getParentEmployee(employeeId);
        if (!data) {
          employeeApprovers.data.push();
        } else {
          employeeApprovers.data.push({
            employeeId,
            approverId: data.id,
            level: x,
          });
        }
        
      } else if (x === 2) {
        const data = 
          await deptLeadershipService.getDepartmentLeadershipWithEmployeeId(employeeId, 0);
        if (!data || !data.employeeId) {
          employeeApprovers.data.push();
        } else {
          employeeApprovers.data.push({
            employeeId,
            approverId: data.employeeId,
            level: x,
          });
        }  
      }
    });
  }
  logger.info('Employee[%s] Approver(s) retrieved!', employeeId);
  return employeeApprovers;
}