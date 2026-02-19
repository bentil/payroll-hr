import { EmployeeWorkTime, WorkTimeUnit } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  CreateEmployeeWorkTimeDto, 
  EmployeeWorkTimeDto,
  QueryEmployeeWorkTimeDto,
  UpdateEmployeeWorkTimeDto,
  UploadEmployeeWorkTimeCheckedRecords,
  UploadEmployeeWorkTimeResponse,
  UploadEmployeeWorkTimeViaSpreadsheetDto
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
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import * as Excel from 'exceljs';
import * as employeeRepository from '../repositories/employee.repository';
import * as payPeriodRepository from '../repositories/pay-period.repository';
import { EmployeeDto } from '../domain/events/employee.event';

const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'EmployeeWorkTimeService' });

const events = {
  created: 'event.EmployeeWorkTime.created',
  modified: 'event.EmployeeWorkTime.modified',
  deleted: 'event.EmployeeWorkTime.deleted'
} as const;

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
  query: QueryEmployeeWorkTimeDto,
  user: AuthorizedUser,
): Promise<ListWithPagination<EmployeeWorkTimeDto>> {
  const {
    page,
    limit: take,
    orderBy,
    payPeriodId,
    timeUnit,
    employeeId: qEmployeeId,
    queryMode,
    companyId
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);
  const { scopedQuery } = await helpers.applySupervisionScopeToQuery(
    user, 
    { employeeId: qEmployeeId, queryMode, companyId },
    { extendAdminCategories: [UserCategory.OPERATIONS] }
  );

  let result: ListWithPagination<EmployeeWorkTimeDto>;
  try {
    logger.debug('Finding EmployeeWorkTime(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery, 
        payPeriodId, 
        timeUnit,
      },
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

export async function uploadEmployeeWorkTimes(
  companyId: number,
  uploadedExcelFile: Express.Multer.File,
  user: AuthorizedUser,
): Promise<UploadEmployeeWorkTimeResponse> {
  const { organizationId } = user;
  const successful: UploadEmployeeWorkTimeResponse['successful'] = [];
  const failed: UploadEmployeeWorkTimeResponse['failed'] = [];
  const workbook = new Excel.Workbook();

  try {
    const collectedRows: UploadEmployeeWorkTimeViaSpreadsheetDto[] = [];
    const sheet = await workbook.xlsx.load(uploadedExcelFile.buffer as any);
    const worksheet = sheet.getWorksheet('employee_work_times');
    if (!worksheet) {
      throw new NotFoundError({
        message: 'Work sheet with data not availble'
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let noRows = -1;
    worksheet.eachRow({ includeEmpty: false }, function() {
      noRows += 1;
    });

    worksheet.eachRow(((row: Excel.Row, rowNumber: number) => {
      const handleNull = (index: number) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return row?.values[index] || null;
      };

      if (row.hasValues && Array.isArray(row.values)) {

        if (rowNumber !== 1) {
          const payload: UploadEmployeeWorkTimeViaSpreadsheetDto = {
            rowNumber,
            employeeNumber: handleNull(1),
            payPeriodCode: handleNull(2),
            timeUnit: handleNull(3),
            timeValue: handleNull(4),
          };

          collectedRows.push(payload);
        }
      }
    }));

    for (const collectedRow of collectedRows) {
      const rowNumber = collectedRow.rowNumber;   

      const validation = await handleEmployeeWorkTimeSpreadSheetValidation(
        collectedRow,
        companyId,
        organizationId
      );

      if (!validation.issues.length) {
        const checkedRecords = validation.checkedRecords;
        const record = createEmployeeWorkTimePayloadStructure(collectedRow, checkedRecords);
        
        const newEmployeeWorkTime = await repository.create(record.employeeWorkTime);
      
        successful.push({
          employeeWorkTimeId: newEmployeeWorkTime.id,
          rowNumber: collectedRow.rowNumber,
        });
      } else {
        failed.push({ rowNumber, errors: validation.issues, });
      }
    }
  } catch (err) {
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return { successful, failed };
}

const handleEmployeeWorkTimeSpreadSheetValidation =
  async (
    data: UploadEmployeeWorkTimeViaSpreadsheetDto, 
    companyId: number,
    organizationId: string,
  ) => {
    const response = {
      checkedRecords: {
        payPeriodId: 0,
        employeeId: 0,
      },
      issues: [] as {
          reason: string,
          column: string,
      }[]
    };

    const expectedColumns = [
      {
        name: 'employeeNumber', type: 'string', required: true,
        validate: async (data: UploadEmployeeWorkTimeViaSpreadsheetDto) => {
          if (!data.employeeNumber) {
            return false;
          }

          const employee: EmployeeDto | null = await employeeRepository.findFirst(
            {
              employeeNumber: data.employeeNumber,
              companyId
            }
          );

          if (!employee) {
            return {
              error: {
                column: 'employeeNumber',
                reason: 'This employee does not exists'
              },
            };
          } else {
            return { id: employee.id, column: 'employeeId' };
          }
          
        }
      },
      {
        name: 'payPeriodCode', type: 'string', required: true,
        validate: async (data: UploadEmployeeWorkTimeViaSpreadsheetDto) => {
          if (!data.payPeriodCode)  {
            return {
              error: {
                column: 'payPeriodCode',
                reason: 'Pay period code is required'
              },
            };
          }
          const payPeriod = await payPeriodRepository.findFirst({
            code: data.payPeriodCode,
            organizationId
          });

          if (!payPeriod) {
            return {
              error: {
                column: 'payPeriodCode',
                reason: 'This pay period does not exists'
              },
            };
          } else {
            return { id: payPeriod.id, column: 'payPeriodId' };
          }
        }
      },
      {
        name: 'timeUnit', type: 'string', required: true,
        validate: async (data: UploadEmployeeWorkTimeViaSpreadsheetDto) => {
          const expectedUnit = Object.keys(WorkTimeUnit);
          if (data.timeUnit && !expectedUnit.includes(data.timeUnit)) {
            return {
              error: {
                column: 'timeUnit',
                reason: 'timeUnit has to be one of the following options.' +
                ` ${JSON.stringify(expectedUnit)}`
              },
            };
          }

          return false;
        }
      },
      {
        name: 'timeValue', type: 'number', required: true,
        validate: async (data: UploadEmployeeWorkTimeViaSpreadsheetDto) => {
          if (data.timeValue) {
            return false;
          }
        }
      },
    ];

    for (const expectedColumn of expectedColumns) {

      const columnName = expectedColumn.name;
      const columnValue = 
        data?.[expectedColumn.name as keyof UploadEmployeeWorkTimeViaSpreadsheetDto] || null;

      if (columnValue && expectedColumn.type === 'date') {
        (data as any)[expectedColumn.name as keyof UploadEmployeeWorkTimeViaSpreadsheetDto] = 
          new Date(columnValue);
      }

      if (!columnValue && expectedColumn.required) {
        response.issues.push({
          column: columnName,
          reason: `${columnName} is required`,
        });
      }
      if (!['date'].includes(expectedColumn.type)) {
        if (columnValue && typeof columnValue !== expectedColumn.type) {
          response.issues.push({
            column: columnName,
            reason: `Expected ${expectedColumn.type} but got ${typeof columnValue}`
          });
        }
      }

      const executeValidator = await expectedColumn.validate(data);
      if (executeValidator && ('error' in executeValidator) ) {
        response.issues.push(executeValidator.error as any);
      }

      if ( executeValidator && ('id' in executeValidator) 
        && executeValidator?.column) {
        const key = executeValidator.column, value = executeValidator.id;
        response.checkedRecords = { ...response.checkedRecords, [key]: value };
      }

    }

    
    return response;
  };

const createEmployeeWorkTimePayloadStructure = (
  collectedRow: UploadEmployeeWorkTimeViaSpreadsheetDto, 
  checkedRecords: UploadEmployeeWorkTimeCheckedRecords
) => {
  const employeeWorkTimeCreatePayload = {
    employeeId: checkedRecords.employeeId,
    payPeriodId: checkedRecords.payPeriodId,
    timeUnit: collectedRow.timeUnit,
    timeValue: collectedRow.timeValue,
  };
  return { employeeWorkTime: employeeWorkTimeCreatePayload };
};