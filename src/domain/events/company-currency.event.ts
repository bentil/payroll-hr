import { Currency, Prisma } from '@prisma/client';

type CompanyCurrency = {
    id: number;
    companyId: number;
    baseCurrencyId: number;
    currencyId: number;
    buyRate: Prisma.Decimal;
    sellRate: Prisma.Decimal;
    createdAt: Date;
    modifiedAt: Date | null;
}

export interface CompanyCurrencyEvent extends CompanyCurrency { 
    currency?: Currency;
    baseCurrency?: Currency;
}