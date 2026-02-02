import { CompanyLevelLeavePackage, Prisma } from '@prisma/client';
import { CompanyLevelLeavePackageDto } from '../../domain/dto/leave-package.dto';

const dataStore: CompanyLevelLeavePackageDto[] = [
  {
    id: 1,
    companyLevelId: 5,
    leavePackageId: 3,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 5, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 1, 
      levelName: 'Level One', 
      juniorLevel: false, 
      parentId: null, 
      childId: null, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 2,
    companyLevelId: 6,
    leavePackageId: 3,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 6, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 2, 
      levelName: 'Level Two', 
      juniorLevel: true, 
      parentId: 5, 
      childId: null, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 3,
    companyLevelId: 7,
    leavePackageId: 3,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 7, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 3, 
      levelName: 'Level Three', 
      juniorLevel: true, 
      parentId: 6, 
      childId: 5, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 4,
    companyLevelId: 6,
    leavePackageId: 4,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 6, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 2, 
      levelName: 'Level Two', 
      juniorLevel: true, 
      parentId: 5, 
      childId: null, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 5,
    companyLevelId: 5,
    leavePackageId: 4,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 5, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 1, 
      levelName: 'Level One', 
      juniorLevel: false, 
      parentId: null, 
      childId: null, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 6,
    companyLevelId: 7,
    leavePackageId: 4,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 7, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 3, 
      levelName: 'Level Three', 
      juniorLevel: true, 
      parentId: 6, 
      childId: 5, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
  {
    id: 7,
    companyLevelId: 7,
    leavePackageId: 7,
    createdAt: new Date('2024-02-05 14:11:07.721'), 
    companyLevel: {
      id: 7, 
      organizationId: '39f2a042-747d-4200-9bdd-cac11538249a', 
      companyId: 1, 
      levelNumber: 3, 
      levelName: 'Level Three', 
      juniorLevel: true, 
      parentId: 6, 
      childId: 5, 
      createdAt: new Date('2023-12-18 13:47:07.392'), 
      modifiedAt: new Date('2023-12-18 21:24:52.632')
    }
  },
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
      id: 4,
      companyId: 1,
      code: 'JWJ8728733',
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
];

export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.CompanyLevelLeavePackageWhereUniqueInput
  ): Promise<CompanyLevelLeavePackage | null> => {
    let result: CompanyLevelLeavePackage | undefined;
    
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
    whereInput: Prisma.CompanyLevelLeavePackageWhereInput,
  ): Promise<CompanyLevelLeavePackage | null> => {
    const result: CompanyLevelLeavePackage | undefined = dataStore.find(item => {
      return item.leavePackage?.leaveTypeId === whereInput.leavePackage?.leaveTypeId
      && item.companyLevelId === whereInput.companyLevelId;
    });

    return result ?? null;
  }
);