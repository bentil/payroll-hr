import { getEmployeeApproversWithDefaults } from '../employee-approver.service';

jest.mock('../../repositories/company-approver.repository');
jest.mock('../../repositories/company-level.repository');
jest.mock('../../repositories/company-tree-node.repository');
jest.mock('../../repositories/department-leadership.repository');
jest.mock('../../repositories/employee-approver.repository');
jest.mock('../../repositories/employee.repository');
jest.mock('../../repositories/grade-level');

describe(('unit test for GetEmployeeApproversWithDefaults'), () => {
  it(('Gets approvers for employee with employee approver at levels 1 and 2'), async () => {
    await expect(getEmployeeApproversWithDefaults({
      employeeId: 1,
      approvalType: 'leave',
    })).resolves.toStrictEqual([
      {
        approverId: 2, 
        createdAt: '2024-09-27T15:11:18.372Z', 
        employeeId: 1, 
        id: 1, 
        level: 1, 
        modifiedAt: '2024-09-27T15:11:18.372Z',
      }, 
      {
        approverId: 8, 
        createdAt: '2024-09-27T15:11:18.372Z', 
        employeeId: 1, 
        id: 3, 
        level: 2, 
        modifiedAt: '2024-09-27T15:11:18.372Z'
      }
    ]);
  });
});