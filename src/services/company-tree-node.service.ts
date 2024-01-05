import { 
  CompanyTreeNodeDto, 
  CreateCompanyTreeNodeDto, 
  UpdateCompanyTreeNodeDto
} from '../domain/dto/company-tree-node.dto';
import { 
  AlreadyExistsError, 
  FailedDependencyError, 
  ForbiddenError, 
  HttpError, 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { getJobTitle } from './job-title.service';
import * as repository from '../repositories/company-tree-node.repository';
import { getEmployee } from './employee.service';
import { rootLogger } from '../utils/logger';
import { KafkaService } from '../components/kafka.component';
import { CompanyTreeNode } from '@prisma/client';
// import { ListWithPagination } from '../repositories/types';
// import * as helpers from '../utils/helpers';
import { errors } from '../utils/constants';
const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'CompanyTreeNode' });

const events = {
  created: 'event.CompanyTreeNode.created',
  modified: 'event.CompanyTreeNode.modified',
};

export async function addCompanyTreeNode(
  creatData: CreateCompanyTreeNodeDto,
  companyId: number
): Promise<CompanyTreeNodeDto> {
  const { parentId, employeeId, jobTitleId, childNodes } = creatData;
  let parent, employee, jobTitle;
  let newCompanyTreeNode: CompanyTreeNode;
  
  //Validation
  try {
    if (!parentId) {
      const checkIfRootExist = await repository.find({ companyId });
      if (checkIfRootExist) {
        throw new AlreadyExistsError({
          message: 'Root node already exist'
        });
      }
    }

    if (parentId && employeeId) {
      [parent, employee, jobTitle] = await Promise.all([
        repository.findOne({ id: parentId }),
        getEmployee(employeeId),
        getJobTitle(jobTitleId)
      ]);
      if (!parent) {
        throw new NotFoundError({
          name: errors.COMPANY_TREE_NODE_NOT_FOUND,
          message: 'CompanyTreeNode does not exist'
        });
      }
      await validateCompanyId(jobTitle.companyId, companyId, parent?.companyId, employee.companyId);
    } else if (parentId) {
      [parent, jobTitle] = await Promise.all([
        repository.findOne({ id: parentId }),
        getJobTitle(jobTitleId)
      ]);
      if (!parent) {
        throw new NotFoundError({
          name: errors.COMPANY_TREE_NODE_NOT_FOUND,
          message: 'CompanyTreeNode does not exist'
        });
      }
      await validateCompanyId(jobTitle.companyId, companyId, parent?.companyId);
    } else if (employeeId) {
      [employee, jobTitle] = await Promise.all([
        getEmployee(employeeId),
        getJobTitle(jobTitleId)
      ]);
      await validateCompanyId(jobTitle.companyId, companyId, employee.companyId);
    } else {
      jobTitle = await getJobTitle(jobTitleId);
      await validateCompanyId(jobTitle.companyId, companyId);
    }
  } catch (err) {
    logger.warn(
      'Confirming employee and/or jobTitle and/or parent company maps to company[%s] failed',
      companyId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('employee, jobTitle and parent companyIds maps to company[%s] failed', companyId);

  logger.debug('Adding new CompanyTreeNode to the database...');
  try {
    if (childNodes) {
      newCompanyTreeNode = await repository.createNodeWithChild({
        companyId,
        jobTitleId,
        employeeId,
        parentId,
        childNodes
      }, true);
    } else {
      newCompanyTreeNode = await repository.create({
        companyId,
        jobTitleId,
        employeeId,
        parentId,
      }, true);
    }
  } catch (err) {
    logger.error('Adding CompanyTreeNode failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  
  // Emit event.CompanyTreeNode.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newCompanyTreeNode);
  logger.info(`${events.created} event created successfully!`);

  return newCompanyTreeNode;
}

export async function getCompanyTree(
  companyId: number
): Promise<CompanyTreeNodeDto> {
  logger.debug('Getting details for CompanyTreeNode for company[%s]', companyId);

  let result: CompanyTreeNodeDto | null;
  try {
    result = await repository.find({ companyId, parentId: null }, true);
    logger.info('Found CompanyTree for company[%s] that matched query', companyId);
  } catch (err) {
    logger.warn('Finding CompanyTree for company[%s] failed', companyId, { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  if (!result) {
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NOT_FOUND,
      message: 'CompanyTree does not exist'
    });
  }

  return result;
}
 
export async function getCompanyTreeNode(
  nodeId: number, companyId: number
): Promise<CompanyTreeNodeDto> {
  logger.debug('Getting details for CompanyTreeNode[%s]', nodeId);
  let companyTreeNode: CompanyTreeNode | null;

  try {
    companyTreeNode = await repository.findOne({ id: nodeId, companyId }, true);
  } catch (err) {
    logger.warn('Getting CompanyTreeNode[%s] failed', nodeId, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'CompanyTreeNode does not exist'
    });
  }

  logger.info('CompanyTreeNode[%s] details retrieved!', nodeId);
  return companyTreeNode;
}

export async function updateCompanyTreeNode(
  nodeId: number,
  companyId: number,
  updateData: UpdateCompanyTreeNodeDto,
): Promise<CompanyTreeNodeDto> {
  const { parentId, employeeId } = updateData;
  const companyTreeNode = await repository.findOne({ id: nodeId, companyId });
  if (!companyTreeNode) {
    logger.warn('CompanyTreeNode[%s] to update does not exist', nodeId);
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node to update does not exist'
    });
  }
  let parent, employee;
  
  //Validation
  if (parentId && employeeId) {
    [parent, employee] = await Promise.all([
      repository.findOne({ id: parentId }),
      getEmployee(employeeId),
    ]);
    validateCompanyId(companyTreeNode.companyId, parent!.companyId, employee.companyId);
  } else if (parentId !== null) {
    parent = await repository.findOne({ id: parentId });
    validateCompanyId(companyTreeNode.companyId, parent!.companyId);
  } else if (employeeId) {
    employee = await getEmployee(employeeId);
    validateCompanyId(companyTreeNode.companyId, employee.companyId);
  }

  logger.debug('Persisting update(s) to CompanyTreeNode[%s]', nodeId);
  const updatedCompanyTreeNode = await repository.update({
    where: { id: nodeId, companyId }, updateData, includeRelations: true
  });
  logger.info('Update(s) to CompanyTreeNode[%s] persisted successfully!', nodeId);

  // Emit event.CompanyTreeNode.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyTreeNode);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyTreeNode;
}

async function validateCompanyId(
  jobTitleCompanyId: number, 
  companyId: number, 
  parentCompanyId?: number, 
  employeeCompanyId?: number,
) {
  if (jobTitleCompanyId && (jobTitleCompanyId !== companyId)) {
    throw new ForbiddenError({ message: 'Not allowed to perform action with this JobTitle.' }); 
  }
  if (parentCompanyId && (parentCompanyId !== companyId)) {
    throw new ForbiddenError({ message: 'Not allowed to perform action with this ParentCompany.' });
  }
  if (employeeCompanyId && (employeeCompanyId !== companyId)) {
    throw new ForbiddenError({ message: 'Not allowed to perform action.' }); 
  }
}
