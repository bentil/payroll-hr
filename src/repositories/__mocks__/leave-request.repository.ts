import { LEAVE_REQUEST_STATUS, LEAVE_RESPONSE_TYPE, LeaveRequest, Prisma } from '@prisma/client';
import { 
  AdjustDaysDto,
  AdjustmentOptions,
  LeaveRequestDto,
  LeaveResponseAction,
  LeaveResponseInputDto,
  UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto,
} from '../../domain/dto/leave-request.dto';
import { CreateLeaveRequestObject } from '../leave-request.repository';
import { InputError } from '../../errors/http-errors';
import { ListWithPagination, getListWithPagination } from '../types';

class UpdateLeaveRequest {
  leavePackageId?: number;
  startDate?: Date;
  returnDate?: Date;
  comment?: string;
}
const dataStore: LeaveRequest[] = [];
const updateDataStore: LeaveRequestDto[] = [
  {
    id: 1,
    employeeId: 34,
    leavePackageId: 3, 
    startDate: new Date('2024-04-03 00:00:00.000'), 
    returnDate: new Date('2024-04-08 00:00:00.000'), 
    comment: 'Travelling with my kids', 
    status: 'DECLINED', 
    createdAt: new Date('2024-02-05 15:03:20.490'), 
    modifiedAt: new Date('2024-02-29 10:08:51.642'), 
    responseCompletedAt: new Date('2024-02-29 10:08:51.641'), 
    cancelledAt: new Date ('2024-02-29 10:08:51.642'), 
    cancelledByEmployeeId: null, 
    numberOfDays: 5, 
    approvalsRequired: 1
  },
  {
    id: 2,
    employeeId: 34,
    leavePackageId: 4, 
    startDate: new Date('2024-04-30 00:00:00.000'), 
    returnDate: new Date('2024-05-20 00:00:00.000'), 
    comment: 'I\'m pregnant for my husband', 
    status: 'APPROVED', 
    createdAt: new Date('2024-02-05 15:03:20.490'), 
    modifiedAt: new Date('2024-02-29 10:08:51.642'), 
    responseCompletedAt: new Date('2024-02-29 10:08:51.641'), 
    cancelledAt: new Date ('2024-02-29 10:08:51.642'), 
    cancelledByEmployeeId: null, 
    numberOfDays: 20, 
    approvalsRequired: 1
  },
  {
    id: 3,
    employeeId: 34,
    leavePackageId: 4, 
    startDate: new Date('2024-04-30 00:00:00.000'), 
    returnDate: new Date('2024-05-30 00:00:00.000'), 
    comment: 'I\'m pregnant for my husband', 
    status: 'DECLINED', 
    createdAt: new Date('2024-02-05 15:03:20.490'), 
    modifiedAt: new Date('2024-02-29 10:08:51.642'), 
    responseCompletedAt: new Date('2024-02-29 10:08:51.641'), 
    cancelledAt: new Date ('2024-02-29 10:08:51.642'), 
    cancelledByEmployeeId: null, 
    numberOfDays: 30, 
    approvalsRequired: 1
  },
  {
    id: 4,
    employeeId: 27,
    leavePackageId: 3, 
    startDate: new Date('2024-07-11 00:00:00.000'), 
    returnDate: new Date('2024-07-17 00:00:00.000'), 
    comment: 'Going to view the eclipse.', 
    status: 'DECLINED', 
    createdAt: new Date('2024-02-05 15:03:20.490'), 
    modifiedAt: new Date('2024-02-29 10:08:51.642'), 
    responseCompletedAt: new Date('2024-02-29 10:08:51.641'), 
    cancelledAt: new Date ('2024-02-29 10:08:51.642'), 
    cancelledByEmployeeId: null, 
    numberOfDays: 6, 
    approvalsRequired: 1
  },
  {
    id: 5,
    employeeId: 27,
    leavePackageId: 4, 
    startDate: new Date('2024-08-15 00:00:00.000'), 
    returnDate: new Date('2024-08-22 00:00:00.000'), 
    comment: 'I\'m pregnant with a baby.', 
    status: 'PENDING', 
    createdAt: new Date('2024-02-05 15:03:20.490'), 
    modifiedAt: new Date('2024-02-29 10:08:51.642'), 
    responseCompletedAt: new Date('2024-02-29 10:08:51.641'), 
    cancelledAt: new Date ('2024-02-29 10:08:51.642'), 
    cancelledByEmployeeId: null, 
    numberOfDays: 7, 
    approvalsRequired: 1
  },
  {
    id: 6,
    employeeId: 1,
    leavePackageId: 8, 
    startDate: new Date('2026-01-29 00:00:00.000'), 
    returnDate: new Date('2026-02-02 00:00:00.000'), 
    comment: 'Tests.', 
    status: 'PENDING', 
    createdAt: new Date('2026-01-05 15:03:20.490'), 
    modifiedAt: new Date('2026-01-21 10:08:51.642'), 
    responseCompletedAt: null, 
    cancelledAt: null, 
    cancelledByEmployeeId: null, 
    numberOfDays: 2, 
    approvalsRequired: 1,
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
  },
  {
    id: 7,
    employeeId: 1,
    leavePackageId: 8, 
    startDate: new Date('2026-01-07 00:00:00.000'), 
    returnDate: new Date('2026-01-09 00:00:00.000'), 
    comment: 'Tests.', 
    status: 'APPROVED', 
    createdAt: new Date('2026-01-05 15:03:20.490'), 
    modifiedAt: new Date('2026-01-21 10:08:51.642'), 
    responseCompletedAt: new Date('2026-01-06 10:08:51.642'), 
    cancelledAt: null, 
    cancelledByEmployeeId: null, 
    numberOfDays: 3, 
    approvalsRequired: 1,
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
];

let lastId = 0;
export const create = jest.fn().mockImplementation(
  async (
    { 
      employeeId, leavePackageId, ...dtoData 
    }: CreateLeaveRequestObject,
  ): Promise<LeaveRequest> => {
    lastId++;
    const LeaveRequest: LeaveRequest = { 
      ...dtoData,
      employeeId,
      leavePackageId,
      id: lastId,
      status: LEAVE_REQUEST_STATUS.PENDING, 
      cancelledByEmployeeId: null, 
      createdAt: new Date(),
      modifiedAt: null,
      responseCompletedAt: null, 
      cancelledAt: null
    };
    dataStore.push(LeaveRequest);
    return LeaveRequest;
  }
);

export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.LeaveRequestWhereUniqueInput
  ): Promise<LeaveRequest | null> => {
    let result: LeaveRequest | undefined;
    if (whereUniqueInput.id) {
      result = updateDataStore.find(item => {
        return item.id === whereUniqueInput.id;
      });
    }

    return result ?? null;
  }
);

export const update = jest.fn().mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (params: {
    where: Prisma.LeaveRequestWhereUniqueInput, 
    data: UpdateLeaveRequest,
    updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
  }): Promise<LeaveRequest> => {
    let index = 0;
    for(let i = 0; i < updateDataStore.length; i++) {
      index++;
      
      if (updateDataStore[i].id === params.where.id) {
        updateDataStore[i].leavePackageId = params.data.leavePackageId === undefined 
          ? updateDataStore[i].leavePackageId : params.data.leavePackageId;
        updateDataStore[i].startDate = params.data.startDate === undefined 
          ? updateDataStore[i].startDate : params.data.startDate;
        updateDataStore[i].returnDate = params.data.returnDate === undefined 
          ? updateDataStore[i].returnDate : params.data.returnDate;
        updateDataStore[i].comment =  params.data.comment === undefined 
          ? updateDataStore[i].comment : params.data.comment;
        updateDataStore[i].modifiedAt = new Date();
        break;
      }
    }

    return updateDataStore[index-1];
  }
);

export const cancel = jest.fn().mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (params: {
    id: number;
    cancelledByEmployeeId: number;
    updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
  }): Promise<LeaveRequest> => {
    let index = 0;
    for(let i = 0; i < updateDataStore.length; i++) {
      index++;
      
      if (updateDataStore[i].id === params.id) {
        updateDataStore[i].cancelledByEmployeeId = params.cancelledByEmployeeId,
        updateDataStore[i].cancelledAt = new Date();
        break;
      }
    }

    return updateDataStore[index-1];
  }
);


export const adjustDays = jest.fn().mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (params: {
    id: number;
    data: AdjustDaysDto & { respondingEmployeeId: number };
    updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
  }): Promise<LeaveRequest> => {
    let index = 0;
    for(let i = 0; i < updateDataStore.length; i++) {
      index++;
      
      if (updateDataStore[i].id === params.id) {
        updateDataStore[i].numberOfDays = params.data.adjustment === AdjustmentOptions.DECREASE
          ? updateDataStore[i].numberOfDays! - params.data.count
          : updateDataStore[i].numberOfDays! - params.data.count,
        updateDataStore[i].comment = params.data.comment,
        updateDataStore[i].cancelledAt = new Date();
        break;
      }
    }

    return updateDataStore[index-1];
  }
);

export const respond = jest.fn().mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (params: {
    id: number;
    data: LeaveResponseInputDto & { 
      approvingEmployeeId: number, 
      finalApproval: boolean,
      approverLevel: number
    };
    updateEmployeeLeaveTypeSummary?: UpdateEmployeeLeaveTypeSummaryViaLeaveRequestDto;
  }): Promise<LeaveRequest> => {
    const { id, data } = params;

    let requestStatus: LEAVE_REQUEST_STATUS | undefined,
      responseType: LEAVE_RESPONSE_TYPE;
    switch (data.action) {
      case LeaveResponseAction.APPROVE:
        requestStatus = data.finalApproval
          ? LEAVE_REQUEST_STATUS.APPROVED
          : undefined;
        responseType = LEAVE_RESPONSE_TYPE.APPROVED;
        break;
      case LeaveResponseAction.DECLINE:
        requestStatus = LEAVE_REQUEST_STATUS.DECLINED;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        responseType = LEAVE_RESPONSE_TYPE.DECLINED;
        break;
      default:
        throw new InputError({ message: 'Invalid leave response type' });
    }
    let index = 0;
    for(let i = 0; i < updateDataStore.length; i++) {
      index++;
      
      if (updateDataStore[i].id === id) {
        updateDataStore[i].status = requestStatus ? requestStatus : updateDataStore[i].status,
        updateDataStore[i].responseCompletedAt = requestStatus ? new Date() : null,
        updateDataStore[i].cancelledAt = new Date();
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
    where?: Prisma.LeaveRequestWhereInput,
    orderBy?: Prisma.LeaveRequestOrderByWithRelationAndSearchRelevanceInput,
    includeRelations?: boolean
  }): Promise<ListWithPagination<LeaveRequest>> => {
    let result: LeaveRequest[] = 
    JSON.parse(JSON.stringify(dataStore)) as typeof dataStore;

    const { skip, take } = params;
    const paginate = skip !== undefined && take !== undefined;
    if (params.where?.employeeId !== undefined) {
      result = result.filter((item) => item.employeeId === params.where?.employeeId);
    } 
    
    if (params.where?.leavePackageId !== undefined) {
      result = result.filter(
        (item) => item?.leavePackageId === params.where?.leavePackageId
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
    whereInput: Prisma.LeaveRequestWhereInput,
  ): Promise<LeaveRequest | null> => {
    const result: LeaveRequest | undefined = dataStore.find(item => {
      return item.employeeId === whereInput.employeeId
      && item.leavePackageId === whereInput.leavePackageId;
    });

    // if (result && !includeRelations) {
    //   result.fromCurrency = undefined;
    //   result.toCurrency = undefined;
    // }

    return result ?? null;
  }
);