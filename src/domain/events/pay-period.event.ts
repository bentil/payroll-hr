import { PAY_PERIOD_TIME_TYPE } from '@prisma/client';

export type PayPeriodEvent = {
    id: number;
    organizationId: string;
    companyId: number | null;
    code: string;
    year: number;
    taxCodeId: number;
    startDate: Date | null;
    endDate: Date | null;
    sequenceNumber: number;
    timePeriod: PAY_PERIOD_TIME_TYPE;
    createdAt: Date;
    modifiedAt: Date | null;
}