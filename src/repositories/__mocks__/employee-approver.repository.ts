import { Prisma } from '@prisma/client';
import { EmployeeApproverDto } from '../../domain/dto/employee-approver.dto';
import * as employeeRepo from './employee.repository';
import { getListWithPagination, ListWithPagination } from '../types';

const dataStore: EmployeeApproverDto[] = [
  {
    'id': 1,
    'employeeId': 1,
    'approverId': 2,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'employeeId': 3,
    'approverId': 2,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'employeeId': 1,
    'approverId': 8,
    'level': 2,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'employeeId': 6,
    'approverId': 4,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 5,
    'employeeId': 6,
    'approverId': 2,
    'level': 2,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const find = jest.fn().mockImplementation(
  async (params: {
    skip?: number,
    take?: number,
    where?: Prisma.EmployeeApproverWhereInput,
    orderBy?: Prisma.EmployeeApproverOrderByWithRelationAndSearchRelevanceInput,
    include?: Prisma.EmployeeApproverInclude
  }): Promise<ListWithPagination<EmployeeApproverDto>> => {
    let result: EmployeeApproverDto[] = 
    JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;

    const { skip, take } = params;
    const paginate = skip !== undefined && take !== undefined;
    if (params.where?.employeeId !== undefined) {
      result = result.filter((item) => item.employeeId === params.where?.employeeId);
    } 
    
    if (params.where?.level !== undefined) {
      result = result.filter(
        (item) => item?.level === params.where?.level
      );
    }
    result = result.slice(params.skip);
    result = result.slice(0, params.take);

    const totalCount = paginate ? result.length : undefined;
    return getListWithPagination(result, { skip, take, totalCount });
  }
);


export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.EmployeeApproverWhereUniqueInput,
    include?: Prisma.EmployeeApproverInclude
  ): Promise<EmployeeApproverDto | null> => {
    const result = dataStore.find(item => {
      return item.id === whereUniqueInput.id;
    });
    if (result && include) {
      const employee = employeeRepo.findOne({ id: result?.employeeId });
      result.employee = employee;
      const approver = employeeRepo.findOne({ id: result?.approverId });
      result.approver = approver;
    }
  
    return result ?? null;
  }
);