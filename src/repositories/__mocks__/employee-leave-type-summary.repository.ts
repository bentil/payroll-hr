import { EmployeeLeaveTypeSummary, Prisma } from '@prisma/client';
import {
  CreateEmployeeLeaveTypeSummaryDto,
  UpdateEmployeeLeaveTypeSummaryDto,
} from '../../domain/dto/employee-leave-type-summary.dto';
import { ListWithPagination, getListWithPagination } from '../types';

const dataStore: EmployeeLeaveTypeSummary[] = [];
const updateDataStore: EmployeeLeaveTypeSummary[] = [
  {
    employeeId: 27,
    leaveTypeId: 2,
    numberOfDaysUsed: 0, 
    numberOfDaysPending: 0, 
    carryOverDays: 50, 
    year: 2026, 
    numberOfCarryOverDaysUsed: 0,
    createdAt: new Date('2026-01-23 01:11:14.613'), 
    modifiedAt: new Date('2026-01-23 01:11:14.613')
  }
];

export const create = jest.fn().mockImplementation(
  async (
    { 
      employeeId, 
      leaveTypeId, 
      numberOfCarryOverDaysUsed, 
      ...remainingData 
    }: CreateEmployeeLeaveTypeSummaryDto
    
  ): Promise<EmployeeLeaveTypeSummary> => {
    const EmployeeLeaveTypeSummary: EmployeeLeaveTypeSummary = { 
      ...remainingData,
      numberOfCarryOverDaysUsed: numberOfCarryOverDaysUsed ?? 0,
      employeeId,
      leaveTypeId,
      createdAt: new Date(),
      modifiedAt: null,
    };
    dataStore.push(EmployeeLeaveTypeSummary);
    return EmployeeLeaveTypeSummary;
  }
);

export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.EmployeeLeaveTypeSummaryWhereUniqueInput
  ): Promise<EmployeeLeaveTypeSummary | null> => {
    let result: EmployeeLeaveTypeSummary | undefined;
    
    if (whereUniqueInput.employeeId_leaveTypeId_year) {
      result = dataStore.find(item => {
        return item.year === whereUniqueInput.year 
          && item.employeeId === whereUniqueInput.employeeId
          && item.leaveTypeId === whereUniqueInput.leaveTypeId;
      });
    }

    return result ?? null;
  }
);

export const update = jest.fn().mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (params: {
    where: Prisma.EmployeeLeaveTypeSummaryWhereUniqueInput, 
    data: UpdateEmployeeLeaveTypeSummaryDto,
  }): Promise<EmployeeLeaveTypeSummary> => {
    let index = 0;
    for(let i = 0; i < updateDataStore.length; i++) {
      index++;
      
      if (
        updateDataStore[i].employeeId === params.where.employeeId &&
        updateDataStore[i].leaveTypeId === params.where.leaveTypeId &&
        updateDataStore[i].year === params.where.year
      ) {
        updateDataStore[i].employeeId = params.data.employeeId === undefined 
          ? updateDataStore[i].employeeId : params.data.employeeId;
        updateDataStore[i].leaveTypeId = params.data.leaveTypeId === undefined 
          ? updateDataStore[i].leaveTypeId : params.data.leaveTypeId;
        updateDataStore[i].numberOfDaysUsed = params.data.numberOfDaysUsed === undefined 
          ? updateDataStore[i].numberOfDaysUsed : params.data.numberOfDaysUsed;
        updateDataStore[i].numberOfDaysPending =  params.data.numberOfDaysPending === undefined 
          ? updateDataStore[i].numberOfDaysPending : params.data.numberOfDaysPending;
        updateDataStore[i].year =  params.data.year === undefined 
          ? updateDataStore[i].year : params.data.year;
        updateDataStore[i].carryOverDays =  params.data.carryOverDays === undefined 
          ? updateDataStore[i].carryOverDays : params.data.carryOverDays;
        updateDataStore[i].modifiedAt = new Date();
        break;
      }
    }

    return updateDataStore[index-1];
  }
);

export const find = jest.fn().mockImplementation(
  async (params: {
    skip?: number,
    take?: number,
    where?: Prisma.EmployeeLeaveTypeSummaryWhereInput,
    orderBy?: Prisma.EmployeeLeaveTypeSummaryOrderByWithRelationAndSearchRelevanceInput,
    includeRelations?: boolean
  }): Promise<ListWithPagination<EmployeeLeaveTypeSummary>> => {
    let result: EmployeeLeaveTypeSummary[] = 
    JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;

    const { skip, take } = params;
    const paginate = skip !== undefined && take !== undefined;
    if (params.where?.employeeId !== undefined) {
      result = result.filter((item) => item.employeeId === params.where?.employeeId);
    } 
    
    if (params.where?.leaveTypeId !== undefined) {
      result = result.filter(
        (item) => item?.leaveTypeId === params.where?.leaveTypeId
      );
    }
    result = result.slice(params.skip);
    result = result.slice(0, params.take);

    const totalCount = paginate ? result.length : undefined;
    return getListWithPagination(result, { skip, take, totalCount });
  }
);

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.EmployeeLeaveTypeSummaryWhereInput,
  ): Promise<EmployeeLeaveTypeSummary | null> => {
    const result: EmployeeLeaveTypeSummary | undefined = dataStore.find(item => {
      return item.employeeId === whereInput.employeeId
      && item.leaveTypeId === whereInput.leaveTypeId
      && item.year === whereInput.year;
    });

    // if (result && !includeRelations) {
    //   result.fromCurrency = undefined;
    //   result.toCurrency = undefined;
    // }

    return result ?? null;
  }
);

export const createOrUpdate = jest.fn().mockImplementation(
  async (
    { 
      employeeId, 
      leaveTypeId, 
      numberOfCarryOverDaysUsed, 
      year,
      ...remainingData 
    }: CreateEmployeeLeaveTypeSummaryDto
    
  ): Promise<EmployeeLeaveTypeSummary> => {
    const result: EmployeeLeaveTypeSummary | undefined = dataStore.find(item => {
      return item.employeeId === employeeId
      && item.leaveTypeId ===  leaveTypeId
      && item.year === year;
    });
    if (result) {
      let index = 0;
      for(let i = 0; i < updateDataStore.length; i++) {
        index++;
      
        if (
          updateDataStore[i].employeeId === employeeId &&
        updateDataStore[i].leaveTypeId === leaveTypeId &&
        updateDataStore[i].year === year
        ) {
          updateDataStore[i].employeeId = employeeId === undefined 
            ? updateDataStore[i].employeeId : employeeId;
          updateDataStore[i].leaveTypeId = leaveTypeId === undefined 
            ? updateDataStore[i].leaveTypeId : leaveTypeId;
          updateDataStore[i].numberOfDaysUsed = remainingData.numberOfDaysUsed === undefined 
            ? updateDataStore[i].numberOfDaysUsed : remainingData.numberOfDaysUsed;
          updateDataStore[i].numberOfDaysPending =  remainingData.numberOfDaysPending === undefined 
            ? updateDataStore[i].numberOfDaysPending : remainingData.numberOfDaysPending;
          updateDataStore[i].year =  year === undefined 
            ? updateDataStore[i].year : year;
          updateDataStore[i].carryOverDays =  remainingData.carryOverDays === undefined 
            ? updateDataStore[i].carryOverDays : remainingData.carryOverDays;
          updateDataStore[i].modifiedAt = new Date();
          break;
        }
      }

      return updateDataStore[index-1];
    }
    else {
      const EmployeeLeaveTypeSummary: EmployeeLeaveTypeSummary = { 
        ...remainingData,
        year,
        numberOfCarryOverDaysUsed: numberOfCarryOverDaysUsed ?? 0,
        employeeId,
        leaveTypeId,
        createdAt: new Date(),
        modifiedAt: null,
      };
      dataStore.push(EmployeeLeaveTypeSummary);
      return EmployeeLeaveTypeSummary;
    }

    
  }
);