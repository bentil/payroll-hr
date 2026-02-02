import { AdjustmentOptions } from '../../domain/dto/leave-request.dto';
import { UserCategory } from '../../domain/user.domain';
import { InputError, NotFoundError, RequirementNotMetError } from '../../errors/http-errors';

jest.mock('../../repositories/company-approver.repository');
jest.mock('../../repositories/company-level.repository');
jest.mock('../../repositories/company-level-leave-package.repository');
jest.mock('../../repositories/employee-leave-type-summary.repository');
jest.mock('../../repositories/employee-approver.repository');
jest.mock('../../repositories/employee.repository');
jest.mock('../../repositories/leave-package.repository');
jest.mock('../../repositories/leave-type.repository');
jest.mock('../../repositories/leave-request.repository');
jest.mock('../../repositories/holiday.repository');
jest.mock('../../utils/notification.util');

import * as leaveReqeustService from '../leave-request.service';


describe(('unit tests for CreateLeaveRequest'), () => {
  it(('Creates a leave request with startDate before returnDate'), async () => {
    await expect(leaveReqeustService.addLeaveRequest(
      {
        'employeeId': 1, 
        'leaveTypeId': 2, 
        'startDate': new Date('2024-10-10'), 
        'returnDate': new Date('2024-09-15'), 
        'comment': 'Taking a short break'
      },
      {
        'userId': 'sdfadfdsaf', 
        'username': 'adfadf', 
        'name': 'test', 
        'organizationId': '19b17215-c753-4245-a10e-8b593fe650eb', 
        'organizationRoleId': 'adfa', 
        'companyIds': [1], 
        'platformUser': true, 
        'employeeId': 1, 
        'permissions': ['employees:write'],
        'category': UserCategory.HR
      }
    )).rejects.toThrow(InputError);
  });

  it(('Creates a leave request that request for number of days more than allowed'), async () => {
    await expect(leaveReqeustService.addLeaveRequest(
      {
        'employeeId': 1, 
        'leaveTypeId': 6, 
        'startDate': new Date('2026-01-29'), 
        'returnDate': new Date('2026-02-15'), 
        'comment': 'Taking a short break'
      },
      {
        'userId': 'sdfadfdsaf', 
        'username': 'adfadf', 
        'name': 'test', 
        'organizationId': '19b17215-c753-4245-a10e-8b593fe650eb', 
        'organizationRoleId': 'adfa', 
        'companyIds': [1], 
        'platformUser': true, 
        'employeeId': 1, 
        'permissions': ['employees:write'],
        'category': UserCategory.HR
      }
    )).rejects.toThrow(RequirementNotMetError);
  });

  it(('Creates a leave request for a leaveType that is not available for employee'), 
    async () => {
      await expect(leaveReqeustService.addLeaveRequest(
        {
          'employeeId': 1, 
          'leaveTypeId': 5, 
          'startDate': new Date('2026-01-29'), 
          'returnDate': new Date('2026-02-15'), 
          'comment': 'Taking a short break'
        },
        {
          'userId': 'sdfadfdsaf', 
          'username': 'adfadf', 
          'name': 'test', 
          'organizationId': '19b17215-c753-4245-a10e-8b593fe650eb', 
          'organizationRoleId': 'adfa', 
          'companyIds': [1], 
          'platformUser': true, 
          'employeeId': 1, 
          'permissions': ['employees:write'],
          'category': UserCategory.HR
        }
      )).rejects.toThrow(NotFoundError);
    });
});

describe(('unit tests for UpdateLeaveRequest'), () => {
  it(('Updates a leave request with returnDate before startDate'), async () => {
    await expect(leaveReqeustService.updateLeaveRequest(
      6,
      {
        'returnDate': new Date('2026-01-20'), 
      },
      {
        'userId': 'sdfadfdsaf', 
        'username': 'adfadf', 
        'name': 'test', 
        'organizationId': '19b17215-c753-4245-a10e-8b593fe650eb', 
        'organizationRoleId': 'adfa', 
        'companyIds': [1], 
        'platformUser': true, 
        'employeeId': 1, 
        'permissions': ['employees:write'],
        'category': UserCategory.HR
      }
    )).rejects.toThrow(InputError);
  });

  it(('Updates a leave request for resulting number of days to be more than allowed'), 
    async () => {
      await expect(leaveReqeustService.updateLeaveRequest(
        6,
        {
          'startDate': new Date('2026-01-20'), 
        },
        {
          'userId': 'sdfadfdsaf', 
          'username': 'adfadf', 
          'name': 'test', 
          'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a', 
          'organizationRoleId': 'adfa', 
          'companyIds': [1], 
          'platformUser': true, 
          'employeeId': 1, 
          'permissions': ['employees:write'],
          'category': UserCategory.HR
        }
      )).rejects.toThrow(RequirementNotMetError);
    });
});

describe(('unit tests for AdjustDays'), () => {
  it(('Updates a leave request for resulting number of days less than zero'), 
    async () => {
      await expect(leaveReqeustService.adjustDays(
        7,
        {
          adjustment: AdjustmentOptions.DECREASE,
          count: 10,
          comment: 'tests '
        },
        {
          'userId': 'sdfadfdsaf', 
          'username': 'adfadf', 
          'name': 'test', 
          'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a', 
          'organizationRoleId': 'adfa', 
          'companyIds': [1], 
          'platformUser': true, 
          'employeeId': 2, 
          'permissions': ['employees:write'],
          'category': UserCategory.HR
        },
      )).rejects.toThrow(InputError);
    }
  );

  it(('Updates a leave request for resulting number of days to be more than allowed'), 
    async () => {
      await expect(leaveReqeustService.adjustDays(
        7,
        {
          adjustment: AdjustmentOptions.DECREASE,
          count: 10,
          comment: 'Need more days off'
        },
        {
          'userId': 'sdfadfdsaf', 
          'username': 'adfadf', 
          'name': 'test', 
          'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a', 
          'organizationRoleId': 'adfa', 
          'companyIds': [1], 
          'platformUser': true, 
          'employeeId': 2, 
          'permissions': ['employees:write'],
          'category': UserCategory.HR
        },
      )).rejects.toThrow(InputError);
    }
  );
});