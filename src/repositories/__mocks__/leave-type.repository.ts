import { LeaveType, Prisma } from '@prisma/client';
import { LeaveTypeDto } from '../../domain/dto/leave-type.dto';

const dataStore: LeaveTypeDto[] = [
  {
    id: 2,
    code: '45ERWTT4',
    name: 'Maternity Leave', 
    colorCode: '#f231be', 
    description: 'The next best thing to being.',
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506')
  },
  {
    id: 5,
    code: '8732HJHJFEF',
    name: 'Christmas Eve', 
    colorCode: '#4e00ad', 
    description: 'The next best thing to.',
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506')
  },
  {
    id: 6,
    code: '8732HJHWAEF',
    name: 'Rest leave', 
    colorCode: '#fefefe', 
    description: 'The next best thing to.',
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506')
  }
];

export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.LeaveTypeWhereUniqueInput
  ): Promise<LeaveType | null> => {
    let result: LeaveType | undefined;
    
    if (whereUniqueInput.id) {
      result = dataStore.find(item => {
        return item.id === whereUniqueInput.id;
      });
    }
    return result ?? null;
  }
);

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.LeaveTypeWhereInput,
  ): Promise<LeaveType | null> => {
    const result: LeaveType | undefined = dataStore.find(item => {
      return item.id === whereInput.id;
    });

    return result ?? null;
  }
);