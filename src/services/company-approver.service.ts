import {
  ApproverType,
  CompanyApprover,
  PayrollCompany
} from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  CreateCompanyApproverDto,
  CompanyApproverDto,
  QueryCompanyApproverDto,
  UpdateCompanyApproverDto,
} from '../domain/dto/company-approver.dto';
import { AuthorizedUser } from '../domain/user.domain';
import {
  HttpError,
  NotFoundError,
  RequirementNotMetError,
  ServerError
} from '../errors/http-errors';
import * as repository from '../repositories/company-approver.repository';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import * as companyService from './payroll-company.service';
import * as companyLevelService from './company-level.service';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'CompanyApproverService' });
const events = {
  created: 'event.CompanyApprover.created',
  modified: 'event.CompanyApprover.modified',
  deleted: 'event.CompanyApprover.deleted',
} as const;


export async function createCompanyApprover(
  companyId: number,
  createData: CreateCompanyApproverDto,
  authUser: AuthorizedUser
): Promise<CompanyApproverDto> {
  const { companyLevelId, level } = createData;
  await helpers.applyCompanyScopeToQuery(authUser, { companyId });
  //Validation
  const [company, companyLevel] = await Promise.all([
    companyService.getPayrollCompany(
      companyId,
    ),
    companyLevelId 
      ? companyLevelService.validateCompanyLevel(
        companyLevelId,
        authUser,
        { companyId }
      )
      : Promise.resolve(null)
  ]);

  if (companyLevel && (company.id !== companyLevel.companyId)) {
    throw new RequirementNotMetError({
      message: 'Manager not for within company'
    });
  }
  logger.info(
    'Company[%s] and CompanyLevel[%s] validated successfully',
    companyId, companyLevelId
  );

  const approverLevelsAllowed = Math.max(
    company.leaveRequestApprovalsRequired,
    company.reimbursementRequestApprovalsRequired
  );
  if (level > approverLevelsAllowed) {
    throw new RequirementNotMetError({
      message: `Approver level exceeds maximum (${approverLevelsAllowed}) allowed`
    });
  }

  logger.debug('Persisting new CompanyApprover...');
  let companyApprover: CompanyApproverDto;
  try {
    companyApprover = await repository.create({
      ...createData,
      companyId
    });
    logger.info(
      'CompanyApprover[%s] persisted successfully!',
      companyApprover.id
    );
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('Persisting CompanyApprover failed', { error: err });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.CompanyApprover.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, companyApprover);
  logger.info(`${events.created} event created successfully!`);

  return companyApprover;
}

export async function updateCompanyApprover(
  id: number,
  companyId: number,
  updateData: UpdateCompanyApproverDto,
  authUser: AuthorizedUser
): Promise<CompanyApproverDto> {
  const { companyLevelId, level } = updateData;
  logger.info('Getting CompanyApprover[%s] to update', id);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser, { companyId }
  );
  let companyApprover: CompanyApproverDto | null;
  try {
    companyApprover = await repository.findFirst({
      id,
      ...scopedQuery
    }, {
      company: true,
    });
  } catch (err) {
    logger.warn(
      'Getting CompanyApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyApprover) {
    logger.warn('CompanyApprover[%s] to update does not exist', id);
    throw new NotFoundError({
      message: 'Company approver to update does not exist'
    });
  }

  const company = companyApprover.company as PayrollCompany;

  if (companyLevelId) {
    try {
      await companyLevelService.validateCompanyLevel(
        companyLevelId,
        authUser,
        { companyId: company.id }
      );
    } catch (err) {
      logger.warn(
        'Getting CompanyLevel[%s] failed',
        companyLevelId, { error: (err as Error).stack }
      );
      if (err instanceof HttpError) {
        err.message = `CompanyLevel: ${err.message}`;
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
  let removeCompanyLevelId : number | undefined;
  if (updateData.approverType) {
    if ((updateData.approverType !== ApproverType.MANAGER) && companyApprover.companyLevelId) {
      removeCompanyLevelId = companyApprover.companyLevelId;
    }
  }

  logger.debug('Persisting update(s) to CompanyApprover[%s]', id);
  const updatedCompanyApprover = await repository.update({
    where: { id, companyId },
    data: { ...updateData, removeCompanyLevelId },
    include: { company: true, companyLevel: true }
  });
  logger.info('Update(s) to CompanyApprover[%s] persisted successfully!', id);

  // Emit event.CompanyApprover.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyApprover);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyApprover;
}

export async function getCompanyApprovers(
  companyId: number,
  query: QueryCompanyApproverDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<CompanyApproverDto>> {
  const {
    page,
    limit: take,
    orderBy,
    approverType,
    level,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser, { companyId }
  );

  let result: ListWithPagination<CompanyApproverDto>;
  logger.debug('Finding CompanyApprover(s) that match query', { query });
  try {
    result = await repository.find({
      skip,
      take,
      where: {
        ...scopedQuery,
        approverType,
        level
      },
      orderBy: orderByInput,
      include: {
        company: true,
        companyLevel: true
      }
    });
    logger.info(
      'Found %d CompanyApprover(s) that matched query',
      result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying CompanyApprovers with query failed',
      { query }, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  return result;
}

export async function getCompanyApprover(
  id: number,
  companyId: number,
  authUser: AuthorizedUser,
): Promise<CompanyApproverDto> {
  logger.debug('Getting details for CompanyApprover[%s]', id);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser, { companyId }
  );

  let companyApprover: CompanyApproverDto | null;
  try {
    companyApprover = await repository.findFirst(
      { id, ...scopedQuery },
      { company: true, companyLevel: true }
    );
  } catch (err) {
    logger.warn(
      'Getting CompanyApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyApprover) {
    logger.warn('CompanyApprover[%s] does not exist', id);
    throw new NotFoundError({ message: 'Company approver does not exist' });
  }

  logger.info('CompanyApprover[%s] details retrieved!', id);
  return companyApprover;
}

export async function deleteCompanyApprover(
  id: number,
  companyId: number,
  authUser: AuthorizedUser
): Promise<void> {
  logger.debug('Getting details for CompanyApprover[%s]', id);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser, { companyId }
  );
  const companyApprover = await repository.findFirst({ id, ...scopedQuery });
  if (!companyApprover) {
    logger.warn('CompanyApprover[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.EMPLOYEE_APPROVER_NOT_FOUND,
      message: 'Company approver to remove does not exist'
    });
  }
  logger.info('CompanyApprover[%s] to remove exists!', id);

  logger.debug('Deleting CompanyApprover[%s] from database...', id);
  let deletedCompanyApprover: CompanyApprover | null;
  try {
    deletedCompanyApprover = await repository.deleteOne({ id });
    logger.info('CompanyApprover[%s] successfully deleted!', id);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.warn(
      'Deleting CompanyApprover[%s] failed',
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.CompanyApprover.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, deletedCompanyApprover);
  logger.info(`${events.deleted} event created successfully!`);
}

type CompanyApproverSummary = Pick<
  CompanyApproverDto,
   'companyId' | 'companyLevelId' | 'level' | 'company' | 'approverType' | 'companyLevel'
>;

export async function getCompanyApproverAtSpecificLevel(params: {
  companyId: number,
  level: number,
}): Promise<CompanyApproverSummary> {
  const { companyId, level } = params;

  logger.debug('Getting details for Company[%s] Approver(s)', companyId);
  let companyApprover: CompanyApproverSummary | null;
  try {
    companyApprover = await repository.findFirst(
      { companyId, level },
      { company: true, companyLevel: true }
    );
  } catch (err) {
    logger.warn(
      'Getting Company[%s] Approvers failed',
      companyId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
  if (!companyApprover) {
    logger.warn('Company[%s] Approver(s) do not exist', companyId);
    throw new NotFoundError({
      message: 'Company approver does not exist at this level'
    });
  }

  return companyApprover;
}