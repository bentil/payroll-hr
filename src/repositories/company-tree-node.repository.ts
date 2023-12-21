import { Prisma } from '@prisma/client';
import { CompanyTreeNodeDto, childNode } from '../domain/dto/company-tree-node.dto';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';
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
  { jobTitleId, employeeId, companyId, ...dtoData }: CreateCompanyTreeNodeObject,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto> {
  const data: Prisma.CompanyTreeNodeCreateInput = {
    ...dtoData,
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    jobTitle: { connect: { id: jobTitleId } },
    company: { connect: { id: companyId } },
  };
  try {
    return await prisma.companyTreeNode.create({
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

export async function createNodeWithChild(
  { jobTitleId, employeeId, companyId, childNodes, ...dtoData }: CreateCompanyTreeNodeObject,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto> {
  const data: Prisma.CompanyTreeNodeCreateInput = {
    ...dtoData,
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    jobTitle: { connect: { id: jobTitleId } },
    company: { connect: { id: companyId } },
  };

  try {
    return await prisma.$transaction(async (txn) => {
      const node = await txn.companyTreeNode.create({
        data,
        include: includeRelations
          ? { employee: true, jobTitle: true }
          : undefined
      });
      const parentId = node.id;
      
      if (childNodes) {
        const nodes = helpers.generateChildNodes(childNodes, companyId, parentId);
        await txn.companyTreeNode.createMany({
          data: nodes,
          skipDuplicates: true
        });
      }

      return node;
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
      ? { employee: true, jobTitle: true }
      : undefined
  });
}

export async function find(
  where?: Prisma.CompanyTreeNodeWhereInput,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto[]> {
  const data = await prisma.companyTreeNode.findMany({
    where,
    include: includeRelations 
      ? { employee: true, jobTitle: true } 
      : undefined
  });

  return data;
}

export async function update(params: {
  where: Prisma.CompanyTreeNodeWhereUniqueInput,
  data: Prisma.CompanyTreeNodeUpdateInput,
  includeRelations?: boolean
}) {
  const { where, data, includeRelations } = params;
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