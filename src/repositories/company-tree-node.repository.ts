import { Prisma } from '@prisma/client';
import {
  CompanyTreeNodeDto, 
  ChildNode, 
  includeRelations
} from '../domain/dto/company-tree-node.dto';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
// import { ListWithPagination, getListWithPagination } from './types';
// import * as helpers from '../utils/helpers';

export interface CreateCompanyTreeNodeObject {
  companyId: number;
  parentId?: number;
  jobTitleId: number;
  employeeId?: number;
  childNodes?: ChildNode[];
}
// export async function create(
//   { jobTitleId, employeeId, companyId, parentId, ...dtoData }: CreateCompanyTreeNodeObject,
//   includeRelations?: boolean,
// ): Promise<CompanyTreeNodeDto> {
//   const data: Prisma.CompanyTreeNodeCreateInput = {
//     ...dtoData,
//     employee: employeeId? { connect: { id: employeeId } }: undefined,
//     jobTitle: { connect: { id: jobTitleId } },
//     company: { connect: { id: companyId } },
//     parent: parentId ? { connect: { id: parentId } } : undefined,
//   };
//   try {
//     return await prisma.companyTreeNode.create({
//       data,
//       include: includeRelations
//         ? { 
//           parent: true, employee: true, jobTitle: true, children: {
//             include: { jobTitle: true, employee: true } 
//           } 
//         }
//         : undefined
//     });
//   } catch (err) {
//     if (err instanceof Prisma.PrismaClientKnownRequestError) {
//       if (err.code === 'P2002') {
//         throw new AlreadyExistsError({
//           message: 'Company tree node already exists',
//           cause: err
//         });
//       }
//     }
//     throw err;
//   }
// }

export async function create(
  { 
    jobTitleId, employeeId, companyId, childNodes, parentId, ...dtoData 
  }: CreateCompanyTreeNodeObject,
  includeRelations?: boolean,
): Promise<CompanyTreeNodeDto> {
    
  const data: Prisma.CompanyTreeNodeCreateInput = {
    ...dtoData,
    employee: employeeId? { connect: { id: employeeId } }: undefined,
    jobTitle: { connect: { id: jobTitleId } },
    company: { connect: { id: companyId } },
    parent: parentId ? { connect: { id: parentId } } : undefined,
    children: childNodes && { createMany: {
      data: childNodes.map(node => { return {
        jobTitleId : node.jobTitleId,
        employeeId : node.employeeId,
        companyId
      }; } )
    } }
  };

  try {
    return await prisma.companyTreeNode.create({
      data,
      include: includeRelations
        ? { 
          parent: true, employee: true, jobTitle: true, children: {
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
  include?: Prisma.CompanyTreeNodeInclude
): Promise<CompanyTreeNodeDto | null> {
  return await prisma.companyTreeNode.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where?: Prisma.CompanyTreeNodeWhereInput,
  include?: Prisma.CompanyTreeNodeInclude,
) {
  return await prisma.companyTreeNode.findFirst({ where, include });
}

export async function findTree(
  where?: Prisma.CompanyTreeNodeWhereInput,
  include?: Prisma.CompanyTreeNodeInclude,
): Promise<CompanyTreeNodeDto | null> {
  return await findFirst(where, include);
}

export async function update(params: {
  data: Prisma.CompanyTreeNodeUpdateInput
  where: Prisma.CompanyTreeNodeWhereUniqueInput,
  include?: Prisma.CompanyTreeNodeInclude
}) {
  const { where, data, include } = params;
  
  try {
    return await prisma.companyTreeNode.update({
      where,
      data,
      include
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

export function recurse(level: number): includeRelations {
  if (level === 0) {
    return {
      include: {
        parent: true, employee: true, jobTitle: true, children: true
      }
    };
  }
  return {
    include: {
      parent: true, employee: true, jobTitle: true, children: recurse(level - 1)
    }
  };
}

export async function deleteNode(
  where: Prisma.CompanyTreeNodeWhereUniqueInput,
) {
  try {
    return await prisma.companyTreeNode.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Node is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteNodeWithChildren(
  where: Prisma.CompanyTreeNodeWhereUniqueInput,
  data: Prisma.CompanyTreeNodeUncheckedUpdateManyInput,
  childrenIds: number[],
) {
  try {
    return await prisma.$transaction(async (txn) => {
      await txn.companyTreeNode.updateMany({
        where: { id: { in: childrenIds } }, 
        data 
      });
      await txn.companyTreeNode.delete({ where });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Node is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}