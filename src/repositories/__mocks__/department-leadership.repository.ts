import { Prisma } from '@prisma/client';
import * as employeeRepo from './employee.repository';
import { DepartmentLeadershipEvent } from '../../domain/events/department-leadership.event';


const dataStore: DepartmentLeadershipEvent[] = [
  {
    'id': 1,
    'departmentId': 1,
    'rank': 0,
    'permanent': true,
    'employeeId': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'departmentId': 1,
    'rank': 1,
    'permanent': true,
    'employeeId': 2,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'departmentId': 1,
    'rank': 2,
    'permanent': true,
    'employeeId': 3,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'departmentId': 1,
    'rank': 3,
    'permanent': true,
    'employeeId': 4,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.DepartmentLeadershipWhereInput,
    include?: Prisma.DepartmentLeadershipInclude
  ): Promise<DepartmentLeadershipEvent | null> => {
    const result = dataStore.find(item => {
      return item.departmentId === whereInput.departmentId
        && item.rank === whereInput.rank;
    });

    if (result && include) {
      const employee = employeeRepo.findOne({ id: result?.employeeId });
      result.employee = employee;
    }
  
    return result ?? null;
  }
);