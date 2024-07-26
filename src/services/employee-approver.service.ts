import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  EmployeeApproverPreflightResponseDto,
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
import { Employee, EmployeeApprover } from '@prisma/client';
import { errors } from '../utils/constants';
import { EmployeeDto } from '../repositories/employee.repository';


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

type EmployeeApproverSummary = Pick<
  EmployeeApproverDto, 
  'approverId' | 'employeeId' | 'level' | 'approver' | 'employee'
>

export async function getEmployeeApproversWithEmployeeId(params: {
  employeeId: number,
  approvalType?: string,
  level?: number
}): Promise<EmployeeApproverSummary[]> {
  const { employeeId, approvalType, level } = params;
  const employee = await employeeService.getEmployee(employeeId, { includeCompany: true });
  // Getting allowed level for employees company
  let approverLevelsRequired: number;
  if (!approvalType) {
    approverLevelsRequired = Math.max(
      employee.company!.leaveRequestApprovalsRequired, 
      employee.company!.reimbursementRequestApprovalsRequired
    );
  } else if (approvalType === 'leave') {
    approverLevelsRequired = employee.company!.leaveRequestApprovalsRequired;
  } else {
    approverLevelsRequired = employee.company!.reimbursementRequestApprovalsRequired;
  }
  const allowedLevels: number[] =[];
  if (level) {
    allowedLevels.push(level);
  } else {
    for (let val = 1; val <= approverLevelsRequired; val++) {
      allowedLevels.push(val);
    }
  }
  

  logger.debug('Getting details for Employee[%s] Approvers', employeeId);
  let employeeApprovers: ListWithPagination<EmployeeApproverSummary>;
  try {
    employeeApprovers = await repository.find({
      where: { employeeId, level },
      include: { employee: true, approver: true }
    });
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] Approvers failed', employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  // Getting list of available and unavailable levels
  const employeeApproverList: EmployeeApproverSummary[] = employeeApprovers.data;
  const availableLevels = [...new Set(employeeApproverList.map((d) => d.level))];
  const unavailableLevels = allowedLevels.filter(i => !availableLevels.includes(i));
  
  // Assigning default levels of employee as approver
  if (unavailableLevels.length > 0) {
    for (const x of unavailableLevels) {
      logger.debug('No EmployeeApprover at Level %s. Getting default', x);
      if (x === 1) {
        let data: Employee;
        try {
          data = await companyTreeService.getParentEmployee(employeeId);
        } catch (err) {
          if(!(err instanceof NotFoundError)) {
            throw err;
          } 
          continue;
        }
        if (data)  {
          employeeApproverList.push({
            employeeId,
            approverId: data.id,
            level: x,
            employee: employee,
            approver: data
          });
        }
      } else if (x === 2) {
        if (employee.departmentId) {
          const data = await deptLeadershipService
            .getDepartmentLeaderships(
              { departmentId: employee.departmentId, rank: 0 },
              { includeEmployee: true }
            );
          if (data.length > 0 && data[0].employeeId) {
            employeeApproverList.push({
              employeeId,
              approverId: data[0].employeeId,
              level: x,
              employee: employee,
              approver: data[0].employee
            });
          }  
        }
      }
    }
  }
  logger.info('Employee[%s] Approver(s) retrieved!', employeeId);
  return employeeApproverList;
}

export async function EmployeeApproverPreflight(
  employeeId: number,
  dtoData: CreateEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<EmployeeApproverPreflightResponseDto> {
  const { approverId, level } = dtoData;
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validating approver
  await helpers.applyEmployeeScopeToQuery(authUser, { employeeId });
  //Validation
  let employee: EmployeeDto, approver: EmployeeDto, 
    existingApprovals: ListWithPagination<EmployeeApproverDto>;
  try {
    [employee, approver, existingApprovals] = await Promise.all([
      employeeService.validateEmployee(
        employeeId, authUser, { throwOnNotActive: true, includeCompany: true }
      ),
      employeeService.validateEmployee(approverId, authUser),
      repository.find({
        where: { employeeId, approverId }
      })
    ]);

    if (employee.companyId !== approver.companyId) {
      errors.push('Approver and employee are not of same company');
    }
  
    const employeesCompanyAllowedLevels = Math.max(
      employee.company!.leaveRequestApprovalsRequired, 
      employee.company!.reimbursementRequestApprovalsRequired
    );
    if (level > employeesCompanyAllowedLevels) {
      errors.push('Level is greater than allowed');
    }
  
    if (approver.status !== 'ACTIVE') {
      warnings.push('Approver is not an active employee');
    }
    if (existingApprovals.data.length > 0) {
      const warn = 'Approver has been set up at Level ';
      const levels = existingApprovals.data.map(x =>  x.level).join(', ');
      warnings.push(warn.concat(levels));
    }
  } catch (err) {
    errors.push((err as Error).message);
  }
  
  logger.info('Employee[%s] and Approver[%s] validated successfully', employeeId, approverId);
  
  return { warnings, errors };
}