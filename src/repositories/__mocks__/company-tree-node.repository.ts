import { Prisma } from '@prisma/client';
import * as employeeRepo from './employee.repository';
import { CompanyTreeNodeDto } from '../../domain/dto/company-tree-node.dto';

                            
const dataStore: CompanyTreeNodeDto[] = [
  {
    'id': 1,
    'companyId': 1,
    'jobTitleId': 1,
    'employeeId': 1,
    'parentId': null,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'companyId': 1,
    'jobTitleId': 1,
    'employeeId': 2,
    'parentId': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'companyId': 1,
    'jobTitleId': 1,
    'employeeId': 3,
    'parentId': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'companyId': 1,
    'jobTitleId': 1,
    'employeeId': 4,
    'parentId': 3,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 5,
    'companyId': 1,
    'jobTitleId': 1,
    'employeeId': 5,
    'parentId': 3,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma. CompanyTreeNodeWhereInput,
    include?: Prisma. CompanyTreeNodeInclude
  ): Promise< CompanyTreeNodeDto | null> => {
    const result = dataStore.find(item => {
      return item.employeeId === whereInput.employeeId;
    });
    if (result && include) {
      const employee = employeeRepo.findOne({ id: result?.parentId });
      result.parent = employee;
    }
  
    return result ?? null;
  }
);