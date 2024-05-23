import { EmployeeWorkTime } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CreateEmployeeWorkTimeDto, 
  EmployeeWorkTimeDto,
  QueryEmployeeWorkTimeDto,
  UpdateEmployeeWorkTimeDto
} from '../domain/dto/employee-work-time.dto';
import * as repository from '../repositories/employee-work-time.repository';
import * as employeeService from '../services/employee.service';
import * as payPeriodService from '../services/pay-period.service';
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

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeWorkTimeService' });

const events = {
  created: 'event.EmployeeWorkTimeService.created',
  modified: 'event.EmployeeWorkTimeService.modified',
  deleted: 'event.EmployeeWorkTimeService.deleted'
};

export async function addEmployeeWorkTime(
  creatData: CreateEmployeeWorkTimeDto,
): Promise<EmployeeWorkTimeDto> {
  const { employeeId, payPeriodId } = creatData;

  // validate employeeId and payPeriod
  try {
    await Promise.all([
      employeeService.getEmployee(employeeId),
      payPeriodService.getPayPeriod(payPeriodId)
    ]);
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] failed', 
      employeeId, payPeriodId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Dependency checks for all provided ids passed');
 
  logger.debug('Adding new EmployeeWorkTime to the database...');
  let newEmployeeWorkTime: EmployeeWorkTime;
  try {
    newEmployeeWorkTime = await repository.create(creatData,
      { 
        employee: true,
        payPeriod: true
      }
    );
    logger.info('EmployeeWorkTime[%s] added successfully!', newEmployeeWorkTime.id);
  } catch (err) {
    logger.error('Adding EmployeeWorkTime failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.EmployeeWorkTime.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newEmployeeWorkTime);
  logger.info(`${events.created} event created successfully!`);

  return newEmployeeWorkTime;
}

export async function getEmployeeWorkTimes(
  query: QueryEmployeeWorkTimeDto
): Promise<ListWithPagination<EmployeeWorkTimeDto>> {
  const {
    page,
    limit: take,
    orderBy,
    employeeId,
    payPeriodId,
    timeUnit,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<EmployeeWorkTimeDto>;
  try {
    logger.debug('Finding EmployeeWorkTime(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { employeeId, payPeriodId, timeUnit },
      orderBy: orderByInput,
      include: {
        employee: true,
        payPeriod: true
      }
    });
    logger.info(
      'Found %d EmployeeWorkTime(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying EmployeeWorkTime with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getEmployeeWorkTime(id: number): Promise<EmployeeWorkTimeDto> {
  logger.debug('Getting details for EmployeeWorkTime[%s]', id);
  let employeeWorkTime: EmployeeWorkTime | null;

  try {
    employeeWorkTime = await repository.findOne({ id }, { employee: true, payPeriod: true });
  } catch (err) {
    logger.warn('Getting EmployeeWorkTime[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!employeeWorkTime) {
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action does not exist'
    });
  }

  logger.info('EmployeeWorkTime[%s] details retrieved!', id);
  return employeeWorkTime;
}

export async function updateEmployeeWorkTime(
  id: number, 
  updateData: UpdateEmployeeWorkTimeDto
): Promise<EmployeeWorkTimeDto> {
  const { employeeId, payPeriodId } = updateData;
  const employeeWorkTime = await repository.findOne({ id });
  if (!employeeWorkTime) {
    logger.warn('EmployeeWorkTime[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action to update does not exisit'
    });
  }

  // validate employeeId and payPeriodId
  try {
    if (employeeId && payPeriodId) {
      await Promise.all([
        employeeService.getEmployee(employeeId),
        payPeriodService.getPayPeriod(payPeriodId)
      ]);
    } else if (employeeId) {
      await employeeService.getEmployee(employeeId);
    } else if (payPeriodId) {
      await payPeriodService.getPayPeriod(payPeriodId);
    }
  } catch (err) {
    logger.warn(
      'Getting Employee[%s] or PayPeriod[%s] failed', 
      employeeId, payPeriodId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to EmployeeWorkTime[%s]', id);
  const updatedEmployeeWorkTime = await repository.update({
    where: { id }, 
    data: updateData,
    include: {
      employee: true,
      payPeriod: true
    }
  });
  logger.info('Update(s) to EmployeeWorkTime[%s] persisted successfully!', id);

  // Emit event.EmployeeWorkTime.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedEmployeeWorkTime);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedEmployeeWorkTime;
}

export async function deleteEmployeeWorkTime(id: number): Promise<void> {
  const employeeWorkTime = await repository.findOne({ id });
  let deletedEmployeeWorkTime: EmployeeWorkTime | null;
  if (!employeeWorkTime) {
    logger.warn('EmployeeWorkTime[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
      message: 'Employee work time action to delete does not exisit'
    });
  }

  logger.debug('Deleting EmployeeWorkTime[%s] from database...', id);
  try {
    deletedEmployeeWorkTime = await repository.deleteEmployeeWorkTime({ id });
    logger.info('EmployeeWorkTime[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting EmployeeWorkTime[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.EmployeeWorkTime.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.deleted, deletedEmployeeWorkTime);
  logger.info(`${events.deleted} event emitted successfully!`);
}