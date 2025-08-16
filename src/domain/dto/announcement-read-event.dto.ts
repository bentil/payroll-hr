import { Decimal } from '@prisma/client/runtime/library';
import { AnnouncementReadEvent } from '@prisma/client';
import { EmployeeDto } from '../events/employee.event';
import { AnnouncementDto, QueryAnnouncementDto } from './announcement.dto';

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

export interface QueryAnnouncementReadEventSummaryDto 
  extends Omit<QueryAnnouncementDto, 'orderBy'> {}

export enum AnnouncementReadEventOrderBy {
  TIMESTAMP_ASC = 'timestamp:asc',
  TIMESTAMP_DESC = 'timestamp:desc',
}

export interface AnnouncementReadEventDto extends AnnouncementReadEvent {
  employee?: EmployeeDto;
  announcement?: AnnouncementDto;
}