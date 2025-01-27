import { DisciplinaryAction } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateDisciplinaryActionDto,
  QueryDisciplinaryActionDto,
  UpdateDisciplinaryActionDto,
  SearchDisciplinaryActionDto,
  DisciplinaryActionDto,
} from '../domain/dto/disciplinary-action.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { 
  FailedDependencyError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import * as repository from '../repositories/disciplinary-action.repository';
import { ListWithPagination } from '../repositories/types';
import * as actionTypeService from '../services/disciplinary-action-type.service';
import * as employeeService from '../services/employee.service';
import * as grievanceReportService from '../services/grievance-report.service';
import * as payrollCompanyService from '../services/payroll-company.service';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import { generateDisciplinaryActionNumber } from '../utils/generator.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'DisciplinaryActionService' });
const events = {
  created: 'event.DisciplinaryAction.created',
  modified: 'event.DisciplinaryAction.modified',
  deleted: 'event.DisciplinaryAction.deleted',
} as const;

export async function addDisciplinaryAction(
  creatData: CreateDisciplinaryActionDto,
  authorizedUser: AuthorizedUser
): Promise<DisciplinaryActionDto> {
  const { companyId, employeeId, grievanceReportId, actionTypeId } = creatData;

  const actionNumber = generateDisciplinaryActionNumber();
  // validate comapnyId, employeeId, grievanceReportId and actionTypeId
  try {
    await Promise.all([
      payrollCompanyService.getPayrollCompany(companyId),
      employeeService.getEmployee(employeeId),
      grievanceReportId
        ? grievanceReportService.getGrievanceReport(grievanceReportId, authorizedUser)
        : undefined,
      actionTypeService.getDisciplinaryActionType(actionTypeId)
    ]);
  } catch (err) {
    logger.warn(
      'Getting Company[%s] or Employee[%s] or GrievanceReport[%s] or ActionType[%s] failed', 
      companyId, employeeId, grievanceReportId, actionTypeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Dependency checks for all provided ids passed');
 
  logger.debug('Adding new DisciplinaryAction to the database...');
  let newDisciplinaryAction: DisciplinaryAction;
  try {
    newDisciplinaryAction = await repository.create({
      companyId,
      employeeId,
      grievanceReportId,
      actionTypeId,
      actionNumber,
      actionDate: creatData.actionDate,
      notes: creatData.notes
    },
    { 
      actionType: true, 
      grievanceReport: { include: { grievanceType: true } }, 
      employee: true 
    }
    );
    logger.info('DisciplinaryAction[%s] added successfully!', newDisciplinaryAction.id);
  } catch (err) {
    logger.error('Adding DisciplinaryAction failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.DisciplinaryAction.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newDisciplinaryAction);
  logger.info(`${events.created} event created successfully!`);

  return newDisciplinaryAction;
}

export async function getDisciplinaryActions(
  query: QueryDisciplinaryActionDto
): Promise<ListWithPagination<DisciplinaryActionDto>> {
  const {
    page,
    limit: take,
    orderBy,
    companyId,
    employeeId,
    actionTypeId,
    grievanceReportId,
    'actionDate.gte': actionDateGte,
    'actionDate.lte': actionDateLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  let result: ListWithPagination<DisciplinaryAction>;
  try {
    logger.debug('Finding DisciplinaryAction(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { companyId, employeeId, actionTypeId, grievanceReportId, actionDate: {
        gte: actionDateGte && new Date(actionDateGte),
        lt: actionDateLte && dateutil.getDate(new Date(actionDateLte), { days: 1 }),
      } },
      orderBy: orderByInput,
      includeRelations: true
    });
    logger.info(
      'Found %d DisciplinaryAction(s) that matched query', result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying DisciplinaryAction with query failed', { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getDisciplinaryAction(id: number): Promise<DisciplinaryActionDto> {
  logger.debug('Getting details for DisciplinaryAction[%s]', id);
  let disciplinaryAction: DisciplinaryAction | null;

  try {
    disciplinaryAction = await repository.findOne({ id }, true);
  } catch (err) {
    logger.warn('Getting DisciplinaryAction[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!disciplinaryAction) {
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_NOT_FOUND,
      message: 'Disciplinary action does not exist'
    });
  }

  logger.info('DisciplinaryAction[%s] details retrieved!', id);
  return disciplinaryAction;
}

export async function searchDisciplinaryActions(
  query: SearchDisciplinaryActionDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<DisciplinaryActionDto>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy); 
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});

  let result: ListWithPagination<DisciplinaryAction>;
  try {
    logger.debug(
      'Finding DisciplinaryAction(s) that matched search query',
      { query }
    );
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        ...scopedQuery,
        actionNumber: {
          search: searchParam,
        },
        notes: {
          search: searchParam,
        },
      },
      include: {
        actionType: true, 
        grievanceReport: { include: { grievanceType: true } },
        employee: true
      }
    });
    logger.info('Found %d DisciplinaryAction(s) that matched query', { query });
  } catch (err) {
    logger.warn(
      'Searching DisciplinaryAction with query failed',
      { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateDisciplinaryAction(
  id: number, 
  updateData: UpdateDisciplinaryActionDto,
  authorizedUser: AuthorizedUser
): Promise<DisciplinaryActionDto> {
  const { grievanceReportId, actionTypeId } = updateData;
  const disciplinaryAction = await repository.findOne({ id });
  if (!disciplinaryAction) {
    logger.warn('DisciplinaryAction[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_NOT_FOUND,
      message: 'Disciplinary action to update does not exisit'
    });
  }

  // validate grievanceReportId and actionTypeId
  try {
    if (grievanceReportId && actionTypeId) {
      await Promise.all([
        grievanceReportService.getGrievanceReport(grievanceReportId, authorizedUser),
        actionTypeService.getDisciplinaryActionType(actionTypeId)
      ]);
    } else if (grievanceReportId) {
      await grievanceReportService.getGrievanceReport(grievanceReportId, authorizedUser);
    } else if (actionTypeId) {
      await actionTypeService.getDisciplinaryActionType(actionTypeId);
    }
  } catch (err) {
    logger.warn(
      'Getting GrievanceReport[%s] or actionType[%s] failed', 
      grievanceReportId, actionTypeId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }

  logger.debug('Persisting update(s) to DisciplinaryAction[%s]', id);
  const updatedDisciplinaryAction = await repository.update({
    where: { id }, data: updateData, includeRelations: true
  });
  logger.info('Update(s) to DisciplinaryAction[%s] persisted successfully!', id);

  // Emit event.DisciplinaryAction.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedDisciplinaryAction);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedDisciplinaryAction;
}

export async function deleteDisciplinaryAction(id: number): Promise<void> {
  const disciplinaryAction = await repository.findOne({ id });
  if (!disciplinaryAction) {
    logger.warn('DisciplinaryAction[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.DISCIPLINARY_ACTION_NOT_FOUND,
      message: 'Disciplinary action to delete does not exisit'
    });
  }

  logger.debug('Deleting DisciplinaryAction[%s] from database...', id);
  let deletedAction: DisciplinaryAction;
  try {
    deletedAction = await repository.deleteOne({ id });
    logger.info('DisciplinaryAction[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting DisciplinaryAction[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.DisciplinaryAction.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedAction);
  logger.info(`${events.deleted} event created successfully!`);
}