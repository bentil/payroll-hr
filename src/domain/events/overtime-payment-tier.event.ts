import { OvertimePaymentTierType, Prisma } from '@prisma/client';

export type OvertimePaymentTierEvent = {
    id: number;
    overtimeId: number;
    type: OvertimePaymentTierType;
    fixedComponent: Prisma.Decimal;
    factorComponent: Prisma.Decimal;
    minHours: number;
    maxHours: number;
    createdAt: Date;
    modifiedAt: Date | null;
    currencyId: number | null;
}