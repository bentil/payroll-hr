export type OvertimeEvent = {
    id: number;
    companyId: number;
    employeeBandId: number;
    code: string;
    name: string;
    description: string;
    minHoursRequired: number;
    maxHoursPermitted: number;
    taxable: boolean;
    active: boolean;
    createdAt: Date;
    modifiedAt: Date | null;
}