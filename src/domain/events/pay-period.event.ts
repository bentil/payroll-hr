import { PayPeriodTimeType } from '@prisma/client';

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
    timePeriod: PayPeriodTimeType;
    createdAt: Date;
    modifiedAt: Date | null;
}