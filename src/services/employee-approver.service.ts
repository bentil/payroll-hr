import {
  Employee,
  EmployeeApprover,
  PayrollCompany
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  EmployeeApproverPreflightResponseDto,
  GetOneEmployeeApproverDto,
  QueryEmployeeApproverDto,
  UpdateEmployeeApproverDto,
} from '../domain/dto/employee-approver.dto';
import { AuthorizedUser } from '../domain/user.domain';
import {
  HttpError,
  NotFoundError,
  RequirementNotMetError,
  ServerError
} from '../errors/http-errors';
import * as repository from '../repositories/employee-approver.repository';
import { EmployeeDto } from '../repositories/employee.repository';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import * as companyTreeService from './company-tree-node.service';
import * as deptLeadershipService from './department-leadership.service';
import * as employeeService from './employee.service';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeApproverService' });
const events = {
  created: 'event.EmployeeApprover.created',
  modified: 'event.EmployeeApprover.modified',
  deleted: 'event.EmployeeApprover.deleted',
} as const;

export async function employeeApproverPreflight(
  employeeId: number,
  dtoData: CreateEmployeeApproverDto,
  authUser: AuthorizedUser
): Promise<EmployeeApproverPreflightResponseDto> {
  const { approverId, level } = dtoData;

  logger.debug(
    'Performing preflight checks for Employee[%s] Approver[%s]',
    employeeId, approverId
  );

  await helpers.applyEmployeeScopeToQuery(authUser, { employeeId });

  const warnings: string[] = [], errors: string[] = [];
  let employee: EmployeeDto | undefined,
    approver: EmployeeDto | undefined,
    existingApprovals: ListWithPagination<EmployeeApproverDto> | undefined;

  const [
    employeeSettledResult,
    approverSettledResult,
    existingApprovalsSettledResult,
  ] = await Promise.allSettled([
    employeeService.validateEmployee(
      employeeId,
      authUser,
      { throwOnNotActive: true, includeCompany: true }
    ),
    employeeService.validateEmployee(approverId, authUser),
    repository.find({
      where: { employeeId, approverId }
    }),
  ]);

  if (employeeSettledResult.status === 'rejected') {
    errors.push(`Employee: ${employeeSettledResult.reason}`);
  } else {
    employee = employeeSettledResult.value;
  }

  if (approverSettledResult.status === 'rejected') {
    errors.push(`Approver: ${approverSettledResult.reason}`);
  } else {
    approver = approverSettledResult.value;
  }

  if (existingApprovalsSettledResult.status === 'rejected') {
    errors.push(
      'Failed to find existing approvals for employee and approver pair'
    );
  } else {
    existingApprovals = existingApprovalsSettledResult.value;
  }

  if (employee && approver && existingApprovals) {
    if (employee.companyId !== approver.companyId) {
      errors.push('Approver could not be found in employee\'s company');
    }

    const approverLevelsAllowed = Math.max(
      employee.company!.leaveRequestApprovalsRequired,
      employee.company!.reimbursementRequestApprovalsRequired
    );
    if (level > approverLevelsAllowed) {
      errors.push(
        `Approver level exceeds maximum (${approverLevelsAllowed}) allowed`
      );
    }

    if (existingApprovals.data.length > 0) {
      warnings.push(
        'Approver has been set up at Level '.concat(
          existingApprovals.data.map(a => a.level).join(', ')
        )
      );
    }
  }

  logger.info(
    'Completed Employee[%s] & Approver[%s] preflight checks',
    employeeId, approverId
  );

  return { warnings, errors };
}

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
      employeeId,
      authUser,
      { throwOnNotActive: true, includeCompany: true }
    ),
    employeeService.validateEmployee(
      approverId,
      authUser,
      { throwOnNotActive: true }
    )
  ]);

  if (employee.companyId !== approver.companyId) {
    throw new RequirementNotMetError({
      message: 'Approver and employee are not of same company'
    });
  }
  logger.info(
    'Employee[%s] and Approver[%s] validated successfully',
    employeeId, approverId
  );

  const approverLevelsAllowed = Math.max(
    employee.company!.leaveRequestApprovalsRequired,
    employee.company!.reimbursementRequestApprovalsRequired
  );
  if (level > approverLevelsAllowed) {
    throw new RequirementNotMetError({
      message: `Approver level exceeds maximum (${approverLevelsAllowed}) allowed`
    });
  }

  logger.debug('Persisting new EmployeeApprover...');
  let employeeApprover: EmployeeApproverDto;
  try {
    employeeApprover = await repository.create({
      ...createData,
      employeeId
    });
    logger.info(
      'EmployeeApprover[%s] persisted successfully!',
      employeeApprover.id
    );
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
    employeeApprover = await repository.findFirst({
      id,
      ...scopedQuery
    }, {
      employee: { include: { company: true } },
    });
  } catch (err) {
    logger.warn(
      'Getting EmployeeApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeApprover) {
    logger.warn('EmployeeApprover[%s] to update does not exist', id);
    throw new NotFoundError({
      message: 'Employee approver to update does not exist'
    });
  }

  const employee = employeeApprover.employee as EmployeeDto;
  const company = employee.company as PayrollCompany;

  if (approverId) {
    try {
      await employeeService.validateEmployee(
        approverId,
        authUser,
        { companyId: company.id }
      );
    } catch (err) {
      logger.warn(
        'Getting Approver[%s] failed',
        approverId, { error: (err as Error).stack }
      );
      if (err instanceof HttpError) {
        err.message = `Approver: ${err.message}`;
        throw err;
      }
    }
  }

  if (level) {
    const approverLevelsAllowed = Math.max(
      company.leaveRequestApprovalsRequired,
      company.reimbursementRequestApprovalsRequired
    );
    if (level > approverLevelsAllowed) {
      throw new RequirementNotMetError({
        message: `Approver level exceeds maximum (${approverLevelsAllowed}) allowed`
      });
    }
  }

  logger.debug('Persisting update(s) to EmployeeApprover[%s]', id);
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
    approverId: qApproverId,
    level,
    inverse,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  
  const approverId = inverse ? employeeId : qApproverId;
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
    authUser, {
      employeeId: !inverse ? employeeId : undefined,
    }
  );

  let result: ListWithPagination<EmployeeApproverDto>;
  logger.debug('Finding EmployeeApprover(s) that match query', { query });
  try {
    result = await repository.find({
      skip,
      take,
      where: {
        ...scopedQuery,
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
      'Querying EmployeeApprovers with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return result;
}

export async function getEmployeeApprover(
  id: number,
  employeeId: number,
  query: GetOneEmployeeApproverDto,
  authUser: AuthorizedUser,
): Promise<EmployeeApproverDto> {
  const { inverse } = query;

  logger.debug('Getting details for EmployeeApprover[%s]', id);
  const approverId = inverse ? employeeId : undefined;
  const { scopedQuery } = await helpers.applyEmployeeScopeToQuery(
    authUser, {
      employeeId: !inverse ? employeeId : undefined,
    }
  );
  
  let employeeApprover: EmployeeApproverDto | null;
  try {
    employeeApprover = await repository.findFirst(
      { id, approverId, ...scopedQuery },
      { employee: true, approver: true }
    );
  } catch (err) {
    logger.warn(
      'Getting EmployeeApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
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
  const employeeApprover = await repository.findFirst({ id, ...scopedQuery });
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
    logger.warn(
      'Deleting EmployeeApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
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
>;

export async function getEmployeeApproversWithDefaults(params: {
  employeeId: number,
  approvalType?: string,
  level?: number
}): Promise<EmployeeApproverSummary[]> {
  const { employeeId, approvalType, level } = params;
  const employee = await employeeService.getEmployee(
    employeeId,
    { includeCompany: true }
  );

  // Getting allowed approver level for employee's company
  const company = employee.company as PayrollCompany;
  let approverLevelsAllowed: number;
  if (!approvalType) {
    approverLevelsAllowed = Math.max(
      company.leaveRequestApprovalsRequired,
      company.reimbursementRequestApprovalsRequired
    );
  } else if (approvalType === 'leave') {
    approverLevelsAllowed = company.leaveRequestApprovalsRequired;
  } else {
    approverLevelsAllowed = company.reimbursementRequestApprovalsRequired;
  }

  const allowedLevels: number[] = [];
  if (level) {
    allowedLevels.push(level);
  } else {
    for (let val = 1; val <= approverLevelsAllowed; val++) {
      allowedLevels.push(val);
    }
  }

  logger.debug('Getting details for Employee[%s] Approver(s)', employeeId);
  let employeeApprovers: ListWithPagination<EmployeeApproverSummary>;
  try {
    employeeApprovers = await repository.find({
      where: { employeeId, level },
      include: { employee: true, approver: true }
    });
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] Approvers failed',
      employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  // Getting list of available and unavailable levels
  const employeeApproverList = employeeApprovers.data;
  const availableLevels = [...new Set(employeeApproverList.map(a => a.level))];
  const unavailableLevels = allowedLevels.filter(
    i => !availableLevels.includes(i)
  );

  // Assigning default levels of employee as approver
  for (const x of unavailableLevels) {
    logger.debug('No EmployeeApprover at Level %s. Getting default', x);
    if (x === 1) {
      let data: Employee;
      try {
        data = await companyTreeService.getParentEmployee(employeeId);
      } catch (err) {
        if (!(err instanceof NotFoundError)) {
          throw err;
        }
        continue;
      }
      if (data) {
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
  logger.info('Employee[%s] Approver(s) retrieved!', employeeId);

  return employeeApproverList;
}