import { CompanyLevel, Prisma } from '@prisma/client';

const dataStore: CompanyLevel[] = [
  {
    'id': 1,
    'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a',
    'companyId': 1,
    'levelNumber': 1,
    'levelName': 'test name 1',
    'juniorLevel': false,
    'parentId': null,
    'childId': 2,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a',
    'companyId': 1,
    'levelNumber': 1,
    'levelName': 'test name 2',
    'juniorLevel': false,
    'parentId': 2,
    'childId': 5,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a',
    'companyId': 1,
    'levelNumber': 1,
    'levelName': 'test name 3',
    'juniorLevel': false,
    'parentId': 3,
    'childId': null,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'organizationId': '3sdfddf-747d-4200-9bdd-cac11538249a',
    'companyId': 5,
    'levelNumber': 1,
    'levelName': 'test name 4',
    'juniorLevel': false,
    'parentId': null,
    'childId': 7,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 5,
    'organizationId': '3sdfddf-747d-4200-9bdd-cac11538249a',
    'companyId': 1,
    'levelNumber': 1,
    'levelName': 'test name 5',
    'juniorLevel': false,
    'parentId': 6,
    'childId': null,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.CompanyLevelWhereInput,
  ): Promise<CompanyLevel | null> => {
    const result = dataStore.find(item => {
      return item.id === whereInput.id;
    });
  
    return result ?? null;
  }
);