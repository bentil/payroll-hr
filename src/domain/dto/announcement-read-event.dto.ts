import { Decimal } from '@prisma/client/runtime/library';
import { AnnouncementReadEvent } from '@prisma/client';
import config from '../../config';
import { EmployeeDto } from '../events/employee.event';
import { AnnouncementDto } from './announcement.dto';

export class CreateAnnouncementReadEventDto {
  employeeId!: number;
}

export class AnnouncementReadEventResponseDto{
  recipientCount!: number;
  readCount!: number;
  readRatio!: Decimal;
  announcement?: AnnouncementDto;
}

export class ReadEventSummmaryDto {
  employee!: {
    fullName: string,
    jobTitle?: {
      id?: number,
      code?: string,
      name?: string
    },
    department?: {
      id?: number,
      code?: string,
      name?: string
    },
  };
  timestamp!: Date;
}

export class QueryAnnouncementReadEventSummaryDto {
  'publishDate.gte'?: string;
  'publishDate.lte'?: string;
  companyId!: number;
  active?: boolean;
  public?: boolean;
  targetGradeLevelId?: number;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: AnnouncementReadEventOrderBy = AnnouncementReadEventOrderBy.TIMESTAMP_DESC;
}

export enum AnnouncementReadEventOrderBy {
  TIMESTAMP_ASC = 'timestamp:asc',
  TIMESTAMP_DESC = 'timestamp:desc',
}

export interface AnnouncementReadEventDto extends AnnouncementReadEvent {
  employee?: EmployeeDto;
  announcement?: AnnouncementDto;
}