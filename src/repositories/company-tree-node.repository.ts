import { Prisma } from '@prisma/client';
import {
  CompanyTreeNodeDto, 
  UpdateCompanyTreeNodeDto, 
  childNode 
} from '../domain/dto/company-tree-node.dto';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, FailedDependencyError } from '../errors/http-errors';
// import { ListWithPagination, getListWithPagination } from './types';
import * as helpers from '../utils/helpers';

export interface CreateCompanyTreeNodeObject {
  companyId: number;
  parentId?: number;
  jobTitleId: number;
  employeeId?: number;
  childNodes?: childNode[];
}
export async function create(
  { jobTitleId, employeeId, companyId, parentId, ...dtoData }: CreateCompanyTreeNodeObject,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto> {
  const data: Prisma.CompanyTreeNodeCreateInput = {
    ...dtoData,
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    jobTitle: { connect: { id: jobTitleId } },
    company: { connect: { id: companyId } },
    parent: parentId ? { connect: { id: parentId } } : undefined,
  };
  try {
    return await prisma.companyTreeNode.create({
      data,
      include: includeRelations
        ? { 
          parent: true, employee: true, jobTitle: true, companyTreeNodes: {
            include: { jobTitle: true, employee: true } 
          } 
        }
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company tree node already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function createNodeWithChild(
  { 
    jobTitleId, employeeId, companyId, childNodes, parentId, ...dtoData 
  }: CreateCompanyTreeNodeObject,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto> {
  if (!childNodes) {
    throw new FailedDependencyError({
      message: 'Dependency check(s) failed',
    });
  }
  const nodes = helpers.generateChildNodes(childNodes, companyId);
    
  const data: Prisma.CompanyTreeNodeCreateInput = {
    ...dtoData,
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    jobTitle: { connect: { id: jobTitleId } },
    company: { connect: { id: companyId } },
    parent: parentId ? { connect: { id: parentId } } : undefined,
    companyTreeNodes: { createMany: {
      data: nodes
    } }
  };

  try {
    return await prisma.companyTreeNode.create({
      data,
      include: includeRelations
        ? { 
          parent: true, employee: true, jobTitle: true, companyTreeNodes: {
            include: { jobTitle: true, employee: true } 
          } 
        }
        : undefined
    });    
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company tree node already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.CompanyTreeNodeWhereUniqueInput,
  includeRelations?: boolean
): Promise<CompanyTreeNodeDto | null> {
  return await prisma.companyTreeNode.findUnique({
    where: whereUniqueInput,
    include: includeRelations
      ? { 
        parent: true, employee: true, jobTitle: true, companyTreeNodes: {
          include: { jobTitle: true, employee: true } 
        } 
      }
      : undefined
  });
}

export async function find(
  where?: Prisma.CompanyTreeNodeWhereInput,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto | null> {
  const data = await prisma.companyTreeNode.findFirst({
    where,
    include: includeRelations 
      ? { 
        parent: true, employee: true, jobTitle: true, companyTreeNodes: helpers.recurse(61)
      }
      : undefined
  });

  return data;
}

export async function update(params: {
  updateData: UpdateCompanyTreeNodeDto,
  where: Prisma.CompanyTreeNodeWhereUniqueInput,
  includeRelations?: boolean
}) {
  const { where, updateData, includeRelations } = params;
  const { employeeId, parentId } = updateData;
  const data: Prisma.CompanyTreeNodeUpdateInput = {
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    parent: { connect: { id: parentId } },
  };
  try {
    return await prisma.companyTreeNode.update({
      where,
      data,
      include: includeRelations
        ? { employee: true, jobTitle: true } 
        : undefined
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company tree node already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}