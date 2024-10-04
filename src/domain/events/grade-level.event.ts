import { GRADE_LEVEL_TYPE } from '@prisma/client';

export type GradeLevelEvent = {
    id: number;
    companyId: number;
    companyLevelId: number;
    name: string;
    code: string;
    description: string;
    type: GRADE_LEVEL_TYPE;
    createdAt: Date;
    modifiedAt: Date | null;
}