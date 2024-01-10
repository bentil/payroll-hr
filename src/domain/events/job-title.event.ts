export type JobTitleEvent = {
    id: number;
    organizationId: string;
    companyId: number;
    employeeBandId: number;
    code: string;
    description: string;
    name: string;
    companyLevelId: number;
    minimumAge: number | null;
    maximumAge: number | null;
    minimumExperienceYears: number | null;
    acceptDisability: boolean;
    createdAt: Date;
    modifiedAt: Date | null;
}