import { HOLIDAY_TYPE } from '@prisma/client';

export type HolidayEvent = {
    id: number;
    code: string;
    name: string;
    description: string;
    type: HOLIDAY_TYPE;
    date: Date;
    createdAt: Date;
    modifiedAt: Date | null;
    organizationId: string;
}