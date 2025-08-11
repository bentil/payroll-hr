import { GRADE_LEVEL_TYPE, GradeLevel, Prisma } from '@prisma/client';
import { getListWithPagination, ListWithPagination } from '../types';

const dataStore: GradeLevel[] = [
  {
    'id': 1,
    'companyId': 1,
    'companyLevelId': 2,
    'name': 'test1',
    'code': 'GMN01',
    'description': '',
    'type': GRADE_LEVEL_TYPE.MINOR,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'companyId': 1,
    'companyLevelId': 2,
    'name': 'test2',
    'code': 'GMN02',
    'description': '',
    'type': GRADE_LEVEL_TYPE.MINOR,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'companyId': 1,
    'companyLevelId': 2,
    'name': 'test3',
    'code': 'GMN03',
    'description': '',
    'type': GRADE_LEVEL_TYPE.MINOR,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'companyId': 1,
    'companyLevelId': 2,
    'name': 'test4',
    'code': 'GMJ01',
    'description': '',
    'type': GRADE_LEVEL_TYPE.MAJOR,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 5,
    'companyId': 1,
    'companyLevelId': 2,
    'name': 'test5',
    'code': 'GMJ02',
    'description': '',
    'type': GRADE_LEVEL_TYPE.MAJOR,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const find = jest.fn().mockImplementation(
  async (params: {
    skip?: number,
    take?: number,
    where?: Prisma.GradeLevelWhereInput,
    orderBy?: Prisma.GradeLevelOrderByWithRelationAndSearchRelevanceInput,
    include?: Prisma.GradeLevelInclude
  }): Promise<ListWithPagination<GradeLevel>> => {
    let result: GradeLevel[] = 
    JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;

    const { skip, take } = params;
    const paginate = skip !== undefined && take !== undefined;
    if (params.where?.id !== undefined) {
      result = result.filter((item) => item.id === params.where?.id);
    } 

    result = result.slice(params.skip);
    result = result.slice(0, params.take);

    const totalCount = paginate ? result.length : undefined;
    return getListWithPagination(result, { skip, take, totalCount });
  }
);


export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.GradeLevelWhereUniqueInput,
  ): Promise<GradeLevel | null> => {
    const result = dataStore.find(item => {
      return item.id === whereUniqueInput.id;
    });
  
    return result ?? null;
  }
);