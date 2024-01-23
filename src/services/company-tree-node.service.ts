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
import { CompanyTreeNode, Employee } from '@prisma/client';
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

  if (employeeId) {
    const node = await repository.findFirst({ employeeId, companyId });
    if (node) {
      throw new AlreadyExistsError({
        message: 'Employee already linked to an existing node'
      });
    }
  }

  let nodeExist = false;
  if (childNodes) {
    childNodes.forEach(async (item) => {
      if (item.employeeId) {
        console.log('hello');
        const node = await repository.findFirst({ employeeId: item.employeeId, companyId });
        if (node) {
          nodeExist = true;
        }
      }
    });

    if (nodeExist) {
      throw new AlreadyExistsError({
        message: 'Employee already linked to an existing node'
      });
    }
  }
  
  //Validation
  try {
    if (!parentId) {
      const checkIfRootExist = await repository.findFirst({ companyId });
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
          message: 'Company tree node does not exist'
        });
      }
      await validateCompanyId({
        jobTitleCompanyId: jobTitle.companyId, 
        companyId, 
        parentCompanyId: parent?.companyId, 
        employeeCompanyId: employee.companyId
      });
    } else if (parentId) {
      [parent, jobTitle] = await Promise.all([
        repository.findOne({ id: parentId }),
        getJobTitle(jobTitleId)
      ]);
      if (!parent) {
        throw new NotFoundError({
          name: errors.COMPANY_TREE_NODE_NOT_FOUND,
          message: 'Company tree node does not exist'
        });
      }
      await validateCompanyId({
        jobTitleCompanyId: jobTitle.companyId, 
        companyId, 
        parentCompanyId: parent?.companyId
      });
    } else if (employeeId) {
      [employee, jobTitle] = await Promise.all([
        getEmployee(employeeId),
        getJobTitle(jobTitleId)
      ]);
      await validateCompanyId({
        jobTitleCompanyId: jobTitle.companyId, 
        companyId, 
        employeeCompanyId: employee.companyId
      });
    } else {
      jobTitle = await getJobTitle(jobTitleId);
      await validateCompanyId({
        jobTitleCompanyId: jobTitle.companyId, 
        companyId
      });
    }
  } catch (err) {
    logger.warn(
      'Confirming Employee and/or JobTitle and/or parent Company maps to Company[%s] failed',
      companyId);
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info('Employee, JobTitle and parent Company Ids maps to company[%s]', companyId);

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
  logger.debug('Getting details for CompanyTreeNode for Company[%s]', companyId);

  let result: CompanyTreeNodeDto | null;
  try {
    result = await repository.findTree(
      { companyId, parentId: null }, 
      { 
        parent: true, 
        employee: true, 
        jobTitle: true, 
        children: repository.recurse(61)
      }
    );
    logger.info('Found CompanyTree for Company[%s] that matched query', companyId);
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
      message: 'Company tree does not exist'
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
    companyTreeNode = await repository.findOne(
      { id: nodeId, companyId }, 
      { 
        parent: true, employee: true, jobTitle: true, children: {
          include: { jobTitle: true, employee: true } 
        } 
      }
    );
  } catch (err) {
    logger.warn('Getting CompanyTreeNode[%s] failed', nodeId, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node does not exist'
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

  if (employeeId) {
    const node = await repository.findFirst({ employeeId, companyId });
    if (node) {
      throw new AlreadyExistsError({
        message: 'Employee already linked to an existing node'
      });
    }
  }
  
  //Validation
  if (parentId && employeeId) {
    [parent, employee] = await Promise.all([
      repository.findOne({ id: parentId }),
      getEmployee(employeeId),
    ]);
    await validateCompanyId({
      companyId: companyTreeNode.companyId, 
      parentCompanyId: parent!.companyId, 
      employeeCompanyId: employee.companyId
    });
  } else if (parentId) {
    parent = await repository.findOne({ id: parentId });
    await validateCompanyId({
      companyId: companyTreeNode.companyId, 
      parentCompanyId: parent!.companyId
    });
  } else if (employeeId) {
    employee = await getEmployee(employeeId);
    await validateCompanyId({
      companyId: companyTreeNode.companyId, 
      employeeCompanyId: employee.companyId
    });
  }
  const data = {
    employee: employeeId ? { connect: { id: employeeId } }: undefined,
    parent: parentId? { connect: { id: parentId } }: undefined,
  };

  logger.debug('Persisting update(s) to CompanyTreeNode[%s]', nodeId);
  const updatedCompanyTreeNode = await repository.update({
    where: { id: nodeId, companyId }, data, include: { employee: true, jobTitle: true } 
  });
  logger.info('Update(s) to CompanyTreeNode[%s] persisted successfully!', nodeId);

  // Emit event.CompanyTreeNode.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyTreeNode);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyTreeNode;
}

export async function getParent(employeeId: number): Promise<Employee | undefined> {
  logger.debug('Getting parent of Employee[%s]', employeeId);
  let companyTreeNode: CompanyTreeNodeDto | null;

  try {
    companyTreeNode = await repository.findFirst(
      { employeeId }, 
      { parent: { include: { employee: true } } }
    );
  } catch (err) {
    logger.warn(
      'Getting parent of Employee[%s] failed', employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    throw new NotFoundError({
      message: 'Employee does not belong to any organization'
    });
  }
  const employee = companyTreeNode.parent?.employee; 

  logger.info('Parent for Employee[%s] retrieved!', employeeId);
  return employee;
}

export async function getSupervisees(employeeId: number) {
  logger.debug('Getting supervisees of Employee[%s]', employeeId);
  let companyTreeNode: CompanyTreeNodeDto | null;

  try {
    companyTreeNode = await repository.findFirst(
      { employeeId }, 
      { children: { include: { employee: true } } }
    );
  } catch (err) {
    logger.warn(
      'Getting supervisees of Employee[%s] failed', employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode || !companyTreeNode.children || companyTreeNode.children.length === 0) {
    throw new NotFoundError({
      message: 'No position for Employee or Employee has no supervisees'
    });
  }
  const children = companyTreeNode.children; 

  const supervisees = children.map((child) => {
    if (child.employee === undefined) {
      return ;
    } else {
      return child.employee;
    }
  });

  logger.info('Supervisees for Employee[%s] retrieved!', employeeId);
  return supervisees;
}

export async function unlinkEmployee(
  nodeId: number,
  companyId: number,
): Promise<CompanyTreeNodeDto> {
  const companyTreeNode = await repository.findOne({ id: nodeId, companyId });
  if (!companyTreeNode) {
    logger.warn('CompanyTreeNode[%s] to update does not exist', nodeId);
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node to update does not exist'
    });
  }
  
  logger.debug('Removing Employee CompanyTreeNode[%s]', nodeId);
  const updatedCompanyTreeNode = await repository.update({
    where: { id: nodeId, companyId }, 
    data: { employee: { disconnect: true } }, 
    include: { 
      employee: true, 
      jobTitle: true, 
      parent: true, 
      children: { include: { jobTitle: true, employee: true } } 
    }
  });
  logger.info('Employee removed from CompanyTreeNode[%s]', nodeId);

  // Emit event.CompanyTreeNode.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyTreeNode);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyTreeNode;
}

async function validateCompanyId(
  options: {
    jobTitleCompanyId?: number, 
    companyId?: number, 
    parentCompanyId?: number, 
    employeeCompanyId?: number,
  }
) {
  const { jobTitleCompanyId, companyId, parentCompanyId, employeeCompanyId } = options;
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
