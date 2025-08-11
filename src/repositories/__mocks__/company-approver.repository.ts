import { ApproverType, Prisma } from '@prisma/client';
import * as companyRepo from './payroll-company.repository';
import { CompanyApproverDto } from '../../domain/dto/company-approver.dto';

							
const dataStore: CompanyApproverDto[] = [
  {
    'id': 1,
    'companyId': 1,
    'approverType': ApproverType.HR,
    'companyLevelId': null,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 2,
    'companyId': 1,
    'approverType': ApproverType.MANAGER,
    'companyLevelId': 2,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 3,
    'companyId': 1,
    'approverType': ApproverType.HR,
    'companyLevelId': null,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 4,
    'companyId': 2,
    'approverType': ApproverType.SUPERVISOR,
    'companyLevelId': null,
    'level': 1,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  },
  {
    'id': 5,
    'companyId': 2,
    'approverType': ApproverType.DEPARMENT_HEAD,
    'companyLevelId': null,
    'level': 2,
    'createdAt': new Date('2024-09-27T15:11:18.372Z'),
    'modifiedAt': new Date ('2024-09-27T15:11:18.372Z'),
  }
];

export const findFirst = jest.fn().mockImplementation(
  async (
    whereInput: Prisma.CompanyApproverWhereInput,
    include?: Prisma.CompanyApproverInclude
  ): Promise<CompanyApproverDto | null> => {
    const result = dataStore.find(item => {
      return item.companyId === whereInput.companyId 
          && item.level === whereInput.level;
    });
    if (result && include) {
      const comapny = companyRepo.findOne({ id: result?.companyId });
      result.company = comapny;
    }
  
    return result ?? null;
  }
);