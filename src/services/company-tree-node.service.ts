import { CompanyTreeNode, Employee } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import { 
  SupervisorInfoQueryDto,
  CompanyTreeNodeDto, 
  CreateCompanyTreeNodeDto, 
  DeleteCompanyTreeNodeQueryDto, 
  UpdateCompanyTreeNodeDto
} from '../domain/dto/company-tree-node.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { 
  AlreadyExistsError, 
  FailedDependencyError, 
  ForbiddenError, 
  HttpError, 
  NotFoundError, 
  RequirementNotMetError, 
  ServerError 
} from '../errors/http-errors';
import * as repository from '../repositories/company-tree-node.repository';
import { errors } from '../utils/constants';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { validateEmployee } from './employee.service';
import { getJobTitle } from './job-title.service';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'CompanyTreeNodeService' });
const events = {
  created: 'event.CompanyTreeNode.created',
  modified: 'event.CompanyTreeNode.modified',
  deleted: 'event.CompanyTreeNode.deleted',
} as const;

export async function addCompanyTreeNode(
  companyId: number,
  creatData: CreateCompanyTreeNodeDto,
  authUser: AuthorizedUser,
): Promise<CompanyTreeNodeDto> {
  const { parentId, employeeId, jobTitleId, childNodes } = creatData;

  if (parentId == null) { // '==' used to match both null and undefined
    logger.debug('Checking if Company[%s] root node exists', companyId);
    const existingRootNode = await repository.findFirst({
      companyId,
      parentId: null
    });
    if (existingRootNode) {
      logger.warn('Company[%s] root node already exists', companyId);
      throw new AlreadyExistsError({
        message: 'Root node already exists'
      });
    }
    logger.info('Company[%s] root node does not exist', companyId);
  } else if (employeeId) {
    logger.debug(
      'Checking if Employee[%s] is linked to Company[%s] TreeNode',
      employeeId, companyId
    );
    const existingNode = await repository.findFirst({ employeeId, companyId });
    if (existingNode) {
      logger.warn(
        'Employee[%s] already linked to Company[%s] TreeNode',
        employeeId, companyId
      );
      throw new AlreadyExistsError({
        message: 'Employee already linked to an existing node'
      });
    }
    logger.info(
      'Employee[%s] not linked to Company[%s] TreeNode',
      employeeId, companyId
    );
  }

  logger.debug(
    'Validating ParentNode[%s], Employee[%s] & JobTitle[%s]',
    parentId, employeeId, jobTitleId
  );
  try {
    const [parent, _employee, jobTitle] = await Promise.all([
      parentId
        ? repository.findOne({ id: parentId, companyId })
        : Promise.resolve(undefined),
      employeeId
        ? validateEmployee(employeeId, authUser, { companyId })
        : Promise.resolve(undefined),
      getJobTitle(jobTitleId)
    ]);
    if (parentId && !parent) {
      throw new NotFoundError({
        name: errors.COMPANY_TREE_NODE_NOT_FOUND,
        message: 'Parent node does not exist'
      });
    }
    await validateNodePropsCompanyContext({
      jobTitleCompanyId: jobTitle.companyId, 
      companyId,
    });
  } catch (err) {
    logger.warn(
      'Validating ParentNode[%s], Employee[%s] or JobTitle[%s] failed',
      parentId, employeeId, jobTitleId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info(
    'ParentNode[%s], Employee[%s] & JobTitle[%s] validated',
    parentId, employeeId, jobTitleId
  );

  if (childNodes) {
    logger.debug('Validating child Node(s) for Node to be added');
    for (const child of childNodes) {
      const [_childEmployee, childJobTitle, existingNode] = await Promise.all([
        child.employeeId
          ? validateEmployee(child.employeeId, authUser, { companyId })
          : Promise.resolve(undefined),
        getJobTitle(child.jobTitleId),
        child.employeeId
          ? repository.findFirst({ employeeId: child.employeeId, companyId })
          : Promise.resolve(null),
      ]);

      await validateNodePropsCompanyContext({
        jobTitleCompanyId: childJobTitle.companyId, 
        companyId,
      });

      if (existingNode) {
        throw new AlreadyExistsError({
          message: 'Employee already linked to an existing node'
        });
      }
    }
  }

  logger.debug('Adding new CompanyTreeNode to the database...');
  let newCompanyTreeNode: CompanyTreeNode;
  try {
    newCompanyTreeNode = await repository.create({
      companyId,
      jobTitleId,
      employeeId,
      parentId,
      childNodes
    }, { 
      parent: true,
      employee: true,
      jobTitle: true,
      children: {
        include: { jobTitle: true, employee: true } 
      }
    });
    logger.info(
      'CompanyTreeNode[%s] added successfully!', newCompanyTreeNode.id
    );
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
  companyId: number,
  authUser: AuthorizedUser,
): Promise<CompanyTreeNodeDto> {
  logger.debug('Retrieving Company[%s] Tree', companyId);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId }
  );

  let tree: CompanyTreeNodeDto | null;
  try {
    tree = await repository.findTree(
      { ...scopedQuery, parentId: null }, 
      { 
        parent: true, 
        employee: true, 
        jobTitle: true, 
        children: repository.recurse(61)
      }
    );
    logger.info('Company[%s] Tree retrieved', companyId);
  } catch (err) {
    logger.warn(
      'Retrieving Company[%s] Tree failed',
      companyId, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  if (!tree) {
    logger.warn('Company[%s] Tree does not exist', companyId);
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NOT_FOUND,
      message: 'Company tree does not exist'
    });
  }

  return tree;
}
 
export async function getCompanyTreeNode(
  nodeId: number,
  companyId: number,
  authUser: AuthorizedUser,
): Promise<CompanyTreeNodeDto> {
  logger.debug('Getting details for CompanyTreeNode[%s]', nodeId);
  let companyTreeNode: CompanyTreeNode | null;

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId }
  );

  try {
    companyTreeNode = await repository.findOne(
      { id: nodeId, ...scopedQuery },
      { 
        parent: true,
        employee: true,
        jobTitle: true,
        children: {
          include: { jobTitle: true, employee: true } 
        } 
      }
    );
  } catch (err) {
    logger.warn(
      'Getting CompanyTreeNode[%s] failed',
      nodeId, { error: (err as Error).stack }
    );
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
  authUser: AuthorizedUser,
): Promise<CompanyTreeNodeDto> {
  const { parentId, employeeId } = updateData;
  logger.debug('Finding CompanyTreeNode[%s] to update', nodeId);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId }
  );

  const companyTreeNode = await repository.findFirst({
    id: nodeId,
    ...scopedQuery
  });
  if (!companyTreeNode) {
    logger.warn('CompanyTreeNode[%s] to update does not exist', nodeId);
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node to update does not exist'
    });
  }
  logger.info('CompanyTreeNode[%s] to update exists', nodeId);
  
  logger.debug(
    'Validating ParentNode[%s], Employee[%s] & unlinked node',
    parentId, employeeId
  );
  try {
    const [existingNode, parent, _employee] = await Promise.all([
      employeeId
        ? repository.findFirst({ employeeId, companyId })
        : Promise.resolve(null),
      parentId
        ? repository.findFirst({ id: parentId, companyId })
        : Promise.resolve(undefined),
      employeeId
        ? validateEmployee(employeeId, authUser, { companyId })
        : Promise.resolve(undefined),
    ]);
    if (existingNode) {
      logger.warn(
        'Employee[%s] already linked to Company[%s] TreeNode',
        employeeId, companyId
      );
      throw new AlreadyExistsError({
        message: 'Employee already linked to an existing node'
      });
    } else if (parentId && !parent) {
      throw new NotFoundError({
        name: errors.COMPANY_TREE_NODE_NOT_FOUND,
        message: 'Parent node does not exist'
      });
    }
  } catch (err) {
    logger.warn(
      'Validating ParentNode[%s], Employee[%s] or unlinked node',
      parentId, employeeId
    );
    if (err instanceof HttpError) throw err;
    throw new FailedDependencyError({
      message: 'Dependency check failed',
      cause: err
    });
  }
  logger.info(
    'ParentNode[%s], Employee[%s] & unlinked node validated',
    parentId, employeeId
  );

  logger.debug('Persisting update(s) to CompanyTreeNode[%s]', nodeId);
  const updatedCompanyTreeNode = await repository.update({
    where: { id: nodeId, companyId },
    data: {
      employee: employeeId ? { connect: { id: employeeId } } : undefined,
      parent: parentId ? { connect: { id: parentId } } : undefined,
    },
    include: { employee: true, jobTitle: true }
  });
  logger.info(
    'Update(s) to CompanyTreeNode[%s] persisted successfully!',
    nodeId
  );

  // Emit event.CompanyTreeNode.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedCompanyTreeNode);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedCompanyTreeNode;
}

export async function getParentEmployee(
  employeeId: number
): Promise<Employee> {
  logger.debug('Getting parent of Employee[%s]', employeeId);
  
  let companyTreeNode: CompanyTreeNodeDto | null;
  try {
    companyTreeNode = await repository.findFirst(
      { employeeId }, 
      { parent: { include: { employee: true } } }
    );
  } catch (err) {
    logger.warn(
      'Getting parent of Employee[%s] failed',
      employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    logger.warn(
      'CompanyTreeNode with Employee[%s] does not exist',
      employeeId
    );
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Employee not found in company tree'
    });
  } else if (!companyTreeNode.parent?.employee) {
    logger.warn(
      'Employee[%s] parent node does not exist or unlinked to an employee',
      employeeId
    );
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'Parent employee does not exist',
    });
  }

  logger.info('Parent for Employee[%s] retrieved!', employeeId);
  return companyTreeNode.parent.employee;
}

export async function getSupervisees(
  employeeId: number
): Promise<Employee[]> {
  logger.debug('Getting supervisees of Employee[%s]', employeeId);
  
  let companyTreeNode: CompanyTreeNodeDto | null;
  try {
    companyTreeNode = await repository.findFirst(
      { employeeId }, 
      { children: { include: { employee: true } } }
    );
  } catch (err) {
    logger.warn(
      'Getting supervisees of Employee[%s] failed',
      employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    logger.warn(
      'CompanyTreeNode with Employee[%s] does not exist',
      employeeId
    );
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Employee not found in company tree'
    });
  }
  
  logger.info('Supervisees for Employee[%s] retrieved!', employeeId);
  return await getSuperviseesEmployeeData(companyTreeNode);
}

export async function unlinkEmployee(
  nodeId: number,
  companyId: number,
  authUser: AuthorizedUser,
): Promise<CompanyTreeNodeDto> {
  logger.debug('Finding CompanyTreeNode[%s] to unlink employee from', nodeId);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId }
  );

  const companyTreeNode = await repository.findFirst({
    id: nodeId,
    ...scopedQuery
  });
  if (!companyTreeNode) {
    logger.warn(
      'CompanyTreeNode[%s] to unlink employee from does not exist',
      nodeId
    );
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node to update does not exist'
    });
  }
  logger.info('CompanyTreeNode[%s] to unlink employee from exists', nodeId);
  
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

export async function deleteNode(
  nodeId: number,
  companyId: number,
  query: DeleteCompanyTreeNodeQueryDto,
  authUser: AuthorizedUser,
): Promise<void> {
  const { successorParentId } = query;

  logger.debug('Finding CompanyTreeNode[%s] to delete', nodeId);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(
    authUser,
    { companyId }
  );
  const companyTreeNode = await repository.findFirst(
    { id: nodeId, ...scopedQuery },
    { children: { include: { employee: true } } }
  );
  if (!companyTreeNode) {
    logger.warn('CompanyTreeNode[%s] to delete does not exist', nodeId);
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Company tree node to delete does not exist'
    });
  }
  logger.info('CompanyTreeNode[%s] to delete exists', nodeId);

  if (companyTreeNode.children && companyTreeNode.children.length > 0) {
    if (!successorParentId) {
      logger.warn(
        'CompanyTreeNode[%s] with child(ren) cannot '
        + 'be removed without a successor',
        nodeId
      );
      throw new RequirementNotMetError({
        message: 'A successor is required when removing a node with a child'
      });
    }

    logger.debug('Finding success CompanyTreeNode[%s]', successorParentId);
    const successorNode = await repository.findOne(
      { id: successorParentId, companyId },
    );
    if (!successorNode) {
      logger.warn('Successor to CompanyTreeNode[%s] does not exist', nodeId);
      throw new NotFoundError({
        name: errors.COMPANY_TREE_NODE_NOT_FOUND,
        message: 'Company tree node successor does not exist'
      });
    }
    logger.info('Successor CompanyTreeNode[%s] exists', successorParentId);

    logger.debug(
      'Removing CompanyTreeNode[%s] and replacing with Successor[%s]',
      nodeId, successorParentId
    );
    const childrenIds = companyTreeNode.children.map(n => n.id);
    await repository.deleteNodeWithChildren(
      { id: nodeId },
      { parentId: successorParentId },
      childrenIds
    );
  } else {
    logger.debug('Removing CompanyTreeNode[%s]', nodeId);
    await repository.deleteNode({ id: nodeId });
  }

  // Emit event.CompanyTreeNode.deleted event
  logger.debug(`Emitting ${events.deleted} event`);
  kafkaService.send(events.deleted, companyTreeNode);
  logger.info(`${events.deleted} event created successfully!`);

  logger.info('CompanyTreeNode[%s] removed!', nodeId);
}

async function validateNodePropsCompanyContext(
  options: {
    companyId: number, 
    jobTitleCompanyId?: number, 
    parentCompanyId?: number, 
    employeeCompanyId?: number,
  }
): Promise<void> {
  const {
    jobTitleCompanyId,
    companyId,
    parentCompanyId,
    employeeCompanyId
  } = options;
  if (employeeCompanyId && (employeeCompanyId !== companyId)) {
    throw new ForbiddenError({
      message: 'Employee data cannot be accessed'
    });
  }
  if (parentCompanyId && (parentCompanyId !== companyId)) {
    throw new ForbiddenError({
      message: 'Parent node data cannot be accessed'
    });
  }
  if (jobTitleCompanyId && (jobTitleCompanyId !== companyId)) {
    throw new ForbiddenError({
      message: 'Job title data cannot be accessed'
    });
  }
}

export async function getReportEmployees(
  companyId: number,
  queryData: SupervisorInfoQueryDto,
  authUser: AuthorizedUser,
): Promise<Employee[]> {
  const { employeeId: uEmployeeId } = authUser;
  const { employeeId: qEmployeeId } = queryData;

  const employeeId = qEmployeeId || uEmployeeId;
  const [
    { scopedQuery: cScopedQuery },
    { scopedQuery: eScopedQuery }
  ] = await Promise.all([
    helpers.applyCompanyScopeToQuery(authUser, { companyId }),
    helpers.applyEmployeeScopeToQuery(authUser, { employeeId }),
  ]);

  logger.debug('Getting supervisees of Employee[%s]', employeeId);
  let companyTreeNode: CompanyTreeNodeDto | null;
  try {
    companyTreeNode = await repository.findFirst(
      { ...cScopedQuery, ...eScopedQuery },
      { children: { include: { employee: true } } }
    );
  } catch (err) {
    logger.warn(
      'Getting supervisees of Employee[%s] failed',
      employeeId, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!companyTreeNode) {
    logger.warn(
      'Company[%s] TreeNode with Employee[%s] does not exist',
      companyId, employeeId
    );
    throw new NotFoundError({
      name: errors.COMPANY_TREE_NODE_NOT_FOUND,
      message: 'Employee not found in company tree'
    });
  }

  const supervisees = await getSuperviseesEmployeeData(companyTreeNode);
  logger.info('Supervisees for Employee[%s] retrieved!', employeeId);
  return supervisees;
}

async function getSuperviseesEmployeeData(
  companyTreeNode: CompanyTreeNodeDto
): Promise<Employee[]> {
  const supervisees: Employee[] = [];
  companyTreeNode.children?.forEach(node => {
    if (node.employee) {
      supervisees.push(node.employee);
    }
  });

  return supervisees;
}