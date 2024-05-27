import { EmployeeOvertimeEntry } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CreateEmployeeOvertimeEntryDto,
  EmployeeOvertimeEntryDto,
  QueryEmployeeOvertimeEntryDto,
  UpdateEmployeeOvertimeEntryDto,
} from '../domain/dto/employee-overtime-entry.dto';
import * as repository from '../repositories/employee-overtime-entry.repository';
import * as employeeService from '../services/employee.service';
import * as payPeriodService from '../services/pay-period.service';
import * as overtimeService from '../services/overtime.service';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  FailedDependencyError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import { AuthorizedUser } from '../domain/user.domain';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeOvertimeEntryService' });

const events = {
  created: 'event.EmployeeOvertimeEntryService.created',
  modified: 'event.EmployeeOvertimeEntryService.modified',
  deleted: 'event.EmployeeOvertimeEntryService.deleted'
};

export async function addEmployeeOvertimeEntry(
  creatData: CreateEmployeeOvertimeEntryDto,
): Promise<EmployeeOvertimeEntryDto> {
  const { employeeId, payPeriodId, overtimeId } = creatData;
  // validate employeeId, payPeriod and overtimeId
  try {
    await Promise.all([
      employeeService.getEmployee(employeeId),
      payPeriodService.getPayPeriod(payPeriodId),
      overtimeService.getOvertime(overtimeId)
    ]);
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] or Overtime[%s] failed', 
      employeeId, payPeriodId, overtimeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Dependency checks for all provided ids passed');
 
  logger.debug('Adding new EmployeeOvertimeEntry to the database...');
  let newEmployeeOvertimeEntry: EmployeeOvertimeEntry;
  try {
    newEmployeeOvertimeEntry = await repository.create(creatData,
      { 
        employee: true,
        payPeriod: true,
        overtime: true
      }
    );
    logger.info('EmployeeOvertimeEntry[%s] added successfully!', newEmployeeOvertimeEntry.id);
  } catch (err) {
    logger.error('Adding EmployeeOvertimeEntry failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.EmployeeOvertimeEntry.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newEmployeeOvertimeEntry);
  logger.info(`${events.created} event created successfully!`);

  return newEmployeeOvertimeEntry;
}

export async function getEmployeeOvertimeEntries(
  query: QueryEmployeeOvertimeEntryDto,
  user: AuthorizedUser,
): Promise<ListWithPagination<EmployeeOvertimeEntryDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId: qEmployeeId,
    payPeriodId,
    overtimeId,
    companyId,
    queryMode, 
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    user, { employeeId: qEmployeeId, queryMode, companyId },
  );

  let result: ListWithPagination<EmployeeOvertimeEntryDto>;
  try {
    logger.debug('Finding EmployeeOvertimeEntry(ies) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery, 
        payPeriodId, 
        overtimeId,
      },
      orderBy: orderByInput,
      include: {
        employee: true,
        payPeriod: true,
        overtime: true
      }
    });
    logger.info(
      'Found %d EmployeeOvertimeEntry(ies) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeOvertimeEntry with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getEmployeeOvertimeEntry(id: number): Promise<EmployeeOvertimeEntryDto> {
  logger.debug('Getting details for EmployeeOvertimeEntry[%s]', id);
  let employeeOvertimeEntry: EmployeeOvertimeEntry | null;

  try {
    employeeOvertimeEntry = await repository.findOne({ id }, { 
      employee: true, 
      payPeriod: true,
      overtime: { include: { overtimePaymentTiers: true } }
    });
  } catch (err) {
    logger.warn('Getting EmployeeOvertimeEntry[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeOvertimeEntry) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action does not exist'
    });
  }

  logger.info('EmployeeOvertimeEntry[%s] details retrieved!', id);
  return employeeOvertimeEntry;
}

export async function updateEmployeeOvertimeEntry(
  id: number, 
  updateData: UpdateEmployeeOvertimeEntryDto
): Promise<EmployeeOvertimeEntryDto> {
  const { employeeId, payPeriodId, overtimeId } = updateData;
  const employeeOvertimeEntry = await repository.findOne({ id });
  if (!employeeOvertimeEntry) {
    logger.warn('EmployeeOvertimeEntry[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action to update does not exisit'
    });
  }

  // validate employeeId, payPeriodId and overtime
  try {
    if (employeeId && payPeriodId && overtimeId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId),
        overtimeService.getOvertime(overtimeId)
      ]);
    } else if (employeeId && overtimeId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        overtimeService.getOvertime(overtimeId)
      ]);
    } else if (payPeriodId && overtimeId) {
      await Promise.all([
        payPeriodService.getPayPeriod(payPeriodId),
        overtimeService.getOvertime(overtimeId)
      ]);
    }
    if (employeeId && payPeriodId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId)
      ]);
    } else if (employeeId) {
      await employeeService.getEmployee(employeeId);
    } else if (payPeriodId) {
      await payPeriodService.getPayPeriod(payPeriodId);
    } else if (overtimeId) {
      await overtimeService.getOvertime(overtimeId);
    }
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] or Overtime[%s] failed', 
      employeeId, payPeriodId, overtimeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to EmployeeOvertimeEntry[%s]', id);
  const updatedEmployeeOvertimeEntry = await repository.update({
    where: { id }, 
    data: updateData,
    include: {
      employee: true,
      payPeriod: true,
      overtime: { include: { overtimePaymentTiers: true } }
    }
  });
  logger.info('Update(s) to EmployeeOvertimeEntry[%s] persisted successfully!', id);

  // Emit event.EmployeeOvertimeEntry.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeOvertimeEntry);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeOvertimeEntry;
}

export async function deleteEmployeeOvertimeEntry(id: number): Promise<void> {
  const employeeOvertimeEntry = await repository.findOne({ id });
  let deletedEmployeeOvertimeEntry: EmployeeOvertimeEntry | null;
  if (!employeeOvertimeEntry) {
    logger.warn('EmployeeOvertimeEntry[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
      message: 'Employee overtime entry action to delete does not exisit'
    });
  }

  logger.debug('Deleting EmployeeOvertimeEntry[%s] from database...', id);
  try {
    deletedEmployeeOvertimeEntry = await repository.deleteEmployeeOvertimeEntry({ id });
    logger.info('EmployeeOvertimeEntry[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting EmployeeOvertimeEntry[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeOvertimeEntry.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, deletedEmployeeOvertimeEntry);
  logger.info(`${events.deleted} event emitted successfully!`);
}