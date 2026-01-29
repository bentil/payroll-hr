import { LeavePackage, Prisma } from '@prisma/client';
import { LeavePackageDto } from '../../domain/dto/leave-package.dto';
import { Decimal } from '@prisma/client/runtime/library';

const dataStore: LeavePackageDto[] = [
  {
    id: 3,
    companyId: 1,
    code: 'AAAAAAAA',
    name: 'Top Earners', 
    description: 'The next best thing to being.',
    leaveTypeId: 5, 
    maxDays: 45, 
    paid: false, 
    redeemable: true, 
    accrued: true, 
    carryOverDaysValue: null, 
    carryOverExpiryDate: null,
    carryOverDaysPercent: new Decimal(4.00), 
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506')
  },
  {
    id: 4,
    companyId: 1,
    code: 'JWJ8728733',
    name: 'Lazy Employees', 
    description: 'The next best thing to being.',
    leaveTypeId: 2, 
    maxDays: 90, 
    paid: false, 
    redeemable: true, 
    accrued: false, 
    carryOverDaysValue: null, 
    carryOverExpiryDate: null,
    carryOverDaysPercent: new Decimal(56.00), 
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506')
  },
  {
    id: 8,
    companyId: 1,
    code: 'JWJ8722133',
    name: 'Lazy Employees', 
    description: 'The next best thing to being.',
    leaveTypeId: 6, 
    maxDays: 5, 
    paid: false, 
    redeemable: true, 
    accrued: false, 
    carryOverDaysValue: null, 
    carryOverDaysPercent: null, 
    carryOverExpiryDate: null,
    createdAt: new Date('2023-12-04 16:35:53.496'), 
    modifiedAt: new Date('2025-05-20 10:41:34.506'),
    companyLevelLeavePackages: [  
      {
        id: 8,
        companyLevelId: 1,
        leavePackageId: 8,
        createdAt: new Date('2024-02-05 14:11:07.721'), 
        companyLevel: {
          id: 1,
          organizationId: '39f2a042-747d-4200-9bdd-cac11538249a',
          companyId: 1,
          levelNumber: 1,
          levelName: 'test name 1',
          juniorLevel: false,
          parentId: null,
          childId: 2,
          createdAt: new Date('2024-09-27T15:11:18.372Z'),
          modifiedAt: new Date ('2024-09-27T15:11:18.372Z'),
        },
        leavePackage: {
          id: 8,
          companyId: 1,
          code: 'JWJ8722133',
          name: 'Lazy Employees', 
          description: 'The next best thing to being.',
          leaveTypeId: 6, 
          maxDays: 5, 
          paid: false, 
          redeemable: true, 
          accrued: false, 
          carryOverDaysValue: null, 
          carryOverDaysPercent: null, 
          carryOverExpiryDate: null,
          createdAt: new Date('2023-12-04 16:35:53.496'), 
          modifiedAt: new Date('2025-05-20 10:41:34.506')
        }
      }
    ]
  },
];

export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.LeavePackageWhereUniqueInput
  ): Promise<LeavePackage | null> => {
    let result: LeavePackage | undefined;
    
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
    whereInput: Prisma.LeavePackageWhereInput,
  ): Promise<LeavePackageDto | null> => {
    let result: LeavePackageDto | undefined;
        
    if (whereInput.leaveTypeId && whereInput.companyLevelLeavePackages) {
      if (whereInput.companyLevelLeavePackages.some)
      {
        for (const data of dataStore) {
          if (data.leaveTypeId === whereInput.leaveTypeId) {
            if (data.companyLevelLeavePackages) {
              for (const compLevelLeavePack of data.companyLevelLeavePackages) {
                if (compLevelLeavePack.companyLevelId === 
                whereInput.companyLevelLeavePackages?.some?.companyLevelId) {
                  result = data;
                  break;
                }
              }
            }
          }   
        }

        if (whereInput.id) {
          result = dataStore.find(item => {
            return item.id === whereInput.id ;
          });
        }        
      }

    }
    return result ?? null;
  }
);