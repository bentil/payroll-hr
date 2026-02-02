import { Holiday, Prisma } from '@prisma/client';
import { getListWithPagination, ListWithPagination } from '../types';

const dataStore: Holiday[] = [
  {
    id: 126,
    code: 'H107',
    name: 'Independence Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-03-06'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.508'),
    modifiedAt: new Date('2025-07-20 18:06:23.508'),
  },
  {
    id: 127,
    code: 'H108',
    name: 'Good Friday',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-04-18'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.514'),
    modifiedAt: new Date('2025-07-20 18:06:23.514'),
  },
  {
    id: 128,
    code: 'H109',
    name: 'Easter Monday',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-04-21'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.521'),
    modifiedAt: new Date('2025-07-20 18:06:23.521'),
  },
  {
    id: 129,
    code: 'H110',
    name: 'May Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-05-01'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.527'),
    modifiedAt: new Date('2025-07-20 18:06:23.527'),
  },
  {
    id: 130,
    code: 'H111',
    name: 'Eid ul-Fitr',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-03-31'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.533'),
    modifiedAt: new Date('2025-07-20 18:06:23.533'), 
  },
  {
    id: 131,
    code: 'H112',
    name: 'Eid ul-Adha',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-06-06'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.533'),
    modifiedAt: new Date('2025-07-20 18:06:23.533'),
  },
  {
    id: 132,
    code: 'H113',
    name: 'Republic Day (Observed)',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-07-04'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.539'),
    modifiedAt: new Date('2025-07-20 18:06:23.539'),
  },
  {
    id: 133,
    code: 'H114',
    name: 'Founders\' Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-08-04'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.546'),
    modifiedAt: new Date('2025-07-20 18:06:23.546'),
  },
  {
    id: 134,
    code: 'H115',
    name: 'Kwame Nkrumah Memorial Day (Observed)',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-09-22'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.550'),
    modifiedAt: new Date('2025-07-20 18:06:23.550'),
  },
  {
    id: 135,
    code: 'H116',
    name: 'Farmer\'s Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-12-05'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.557'),
    modifiedAt: new Date('2025-07-20 18:06:23.557'),
  },
  {
    id: 136,
    code: 'H117',
    name: 'Christmas Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-12-25'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.563'),
    modifiedAt: new Date('2025-07-20 18:06:23.563'),
  },
  {
    id: 137,
    code: 'H118',
    name: 'Boxing Day',
    description: 'null',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-12-26'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-20 18:06:23.569'),
    modifiedAt: new Date('2025-07-20 18:06:23.569'),
  },
  {
    id: 139,
    code: 'H0021',
    name: 'SALARY DAY',
    description: 'off day',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-01-17'),
    organizationId: '83ec7a0a-0e88-4779-be34-8afb7b92576b',
    createdAt: new Date('2025-07-21 11:31:31.491'),
    modifiedAt: new Date('2025-07-21 11:31:31.491'),  
  },
  {
    id: 141,
    code: 'H00211',
    name: 'SALARY DAY',
    description: 'off day',
    type: 'PUBLIC_HOLIDAY',
    date: new Date('2025-01-17'),
    organizationId: '39f2a042-747d-4200-9bdd-cac11538249a',
    createdAt: new Date('2025-07-21 11:33:55.226'),
    modifiedAt: new Date('2025-07-21 11:33:55.226'),  
  },
  {
    id: 141,
    code: 'H00212',
    name: 'OFF DAY',
    description: 'off day',
    type: 'WEEKEND',
    date: new Date('2026-02-01'),
    organizationId: '39f2a042-747d-4200-9bdd-cac11538249a',
    createdAt: new Date('2025-07-21 11:33:55.226'),
    modifiedAt: new Date('2025-07-21 11:33:55.226'),  
  },
  {
    id: 141,
    code: 'H00213',
    name: 'OFF DAY',
    description: 'off day',
    type: 'WEEKEND',
    date: new Date('2026-01-31'),
    organizationId: '39f2a042-747d-4200-9bdd-cac11538249a',
    createdAt: new Date('2026-07-21 11:33:55.226'),
    modifiedAt: new Date('2025-07-21 11:33:55.226'),  
  },
];


export const count = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.HolidayWhereInput,
  ): Promise<number> => {
    let result: Holiday[] = 
        JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;
    if (whereInput.organizationId !== undefined) {
      result = result.filter((item) => item.organizationId === whereInput.organizationId);
    }
    if (whereInput.date !== undefined) {
      const dateCheckResult: Holiday[] = [];
      if (typeof whereInput.date === 'object') {
        const newDate = whereInput.date as Prisma.DateTimeFilter;        
        if (newDate.gte !== undefined && newDate.lte !==undefined) {
          const newGte = new Date(newDate.gte);
          const newLte = new Date(newDate.lte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if ((newDate >= newGte) && (newDate <= newLte)) {
                dateCheckResult.push(item);
              }
            }
          );
        } else if (newDate.gte !== undefined) {
          const newGte = new Date(newDate.gte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if (newDate >= newGte) {
                dateCheckResult.push(item);
              }
            }
          );
        } else if (newDate.lte !== undefined) {
          const newLte = new Date(newDate.lte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if (newDate <= newLte) {
                dateCheckResult.push(item);
              }
            }
          );
        }
      }
      result = dateCheckResult;
    }

    if (whereInput.type !== undefined) {
      if (typeof whereInput.type === 'object') {
        const typeFilter = whereInput.type as Prisma.EnumHOLIDAY_TYPEFilter;
        if (typeFilter.not !== undefined) {
          result = result.filter((item) => item.type !== typeFilter.not);
        }
        if (typeFilter.notIn !== undefined) {
          result = result.filter((item) => !typeFilter.notIn!.includes(item.type));
        }
      }
    }

    return result.length;
  });

export const find = jest.fn().mockImplementation(
  async (params: {
  skip?: number,
  take?: number,
  where?: Prisma.HolidayWhereInput,
  orderBy?: Prisma.HolidayOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<Holiday>> => {
    let result: Holiday[] = 
        JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;
    if (params.where?.organizationId !== undefined) {
      result = result.filter((item) => item.organizationId === params.where!.organizationId);
    }
    if (params.where?.date !== undefined) {
      const dateCheckResult: Holiday[] = [];
      if (typeof params.where.date === 'object') {
        const newDate = params.where.date as Prisma.DateTimeFilter;        
        if (newDate.gte !== undefined && newDate.lte !==undefined) {
          const newGte = new Date(newDate.gte);
          const newLte = new Date(newDate.lte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if ((newDate >= newGte) && (newDate <= newLte)) {
                dateCheckResult.push(item);
              }
            }
          );
        } else if (newDate.gte !== undefined) {
          const newGte = new Date(newDate.gte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if (newDate >= newGte) {
                dateCheckResult.push(item);
              }
            }
          );
        } else if (newDate.lte !== undefined) {
          const newLte = new Date(newDate.lte);
          
          result.forEach(
            (item) => {
              const newDate = new Date(item.date);
              if (newDate <= newLte) {
                dateCheckResult.push(item);
              }
            }
          );
        }
      }
      result = dateCheckResult;
    }

    if (params.where?.type !== undefined) {
      if (typeof params.where.type === 'object') {
        const typeFilter = params.where.type as Prisma.EnumHOLIDAY_TYPEFilter;
        if (typeFilter.not !== undefined) {
          result = result.filter((item) => item.type !== typeFilter.not);
        }
        if (typeFilter.notIn !== undefined) {
          result = result.filter((item) => !typeFilter.notIn!.includes(item.type));
        }
      }
    }

    return getListWithPagination(result);
  });