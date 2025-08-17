import { PayrollCompany, Prisma } from '@prisma/client';

const dataStore: PayrollCompany[] = [
  {
    'id': 3,
    'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a',
    'name': 'test company 1',
    'address': 'zo2j34',
    'logoUrl': null,
    'contactEmail': 'conatact@gmail.com',
    'contactMsisdn': null,
    'status': 'ACTIVE',
    'currencyId': 1,
    'countryId': null,
    'allowNegativeRates': false,
    'considerPublicHolidayAsWorkday': false,
    'considerWeekendAsWorkday': false,
    'enableEmployeeLogin': true,
    'workHoursInADay': 8,
    'leaveRequestApprovalsRequired': 2,
    'reimbursementRequestApprovalsRequired': 2,
    'notifyApproversOnRequestResponse': false,
    'createdAt': new Date('2024-07-15T13:02:56.683Z'),
    'modifiedAt': new Date('2024-07-22T13:52:16.653Z'),
    'statusLastModifiedAt': new Date('2024-07-22T13:52:16.651Z'),
    'allowNegativeRatesLastModifiedAt': new Date('2024-07-22T13:52:16.651Z')
  },
  {
    'id': 2,
    'organizationId': '39f2a042-747d-4200-9bdd-cac1153',
    'name': 'test company',
    'address': 'zo2j34',
    'logoUrl': null,
    'contactEmail': 'conatact@gmail.com',
    'contactMsisdn': null,
    'status': 'ACTIVE',
    'currencyId': 1,
    'countryId': null,
    'allowNegativeRates': false,
    'considerPublicHolidayAsWorkday': false,
    'considerWeekendAsWorkday': false,
    'enableEmployeeLogin': true,
    'workHoursInADay': 8,
    'leaveRequestApprovalsRequired': 2,
    'reimbursementRequestApprovalsRequired': 2,
    'notifyApproversOnRequestResponse': false,
    'createdAt': new Date('2024-07-03T12:01:39.090Z'),
    'modifiedAt': new Date('2024-07-22T13:50:31.915Z'),
    'statusLastModifiedAt': new Date('2024-07-22T13:50:31.909Z'),
    'allowNegativeRatesLastModifiedAt': new Date('2024-07-22T13:50:31.909Z')
  },
  {
    'id': 1,
    'organizationId': '39f2a042-747d-4200-9bdd-cac11538249a',
    'name': 'test company77',
    'address': 'zo2j34',
    'logoUrl': null,
    'contactEmail': 'conatact@gmail.com',
    'contactMsisdn': null,
    'status': 'ACTIVE',
    'currencyId': 1,
    'countryId': null,
    'allowNegativeRates': false,
    'considerPublicHolidayAsWorkday': false,
    'considerWeekendAsWorkday': false,
    'enableEmployeeLogin': true,
    'workHoursInADay': 8,
    'leaveRequestApprovalsRequired': 2,
    'reimbursementRequestApprovalsRequired': 2,
    'notifyApproversOnRequestResponse': false,
    'createdAt': new Date('2024-06-24T21:04:41.956Z'),
    'modifiedAt': new Date('2024-07-16T22:24:47.938Z'),
    'statusLastModifiedAt': new Date('2024-07-16T22:24:47.935Z'),
    'allowNegativeRatesLastModifiedAt': new Date('2024-07-16T22:24:47.935Z')
  }
];


export const findOne = jest.fn().mockImplementation(
  async (
    whereUniqueInput: Prisma.PayrollCompanyWhereUniqueInput,
  ): Promise<PayrollCompany | null> => {
    const result = dataStore.find(item => {
      return item.id === whereUniqueInput.id;
    });
  
    return result ?? null;
  }
);