import { 
  Announcement, 
  AnnouncementResource, 
  GradeLevel, 
  PayrollCompany, 
  ResourceType 
} from '@prisma/client';
import config from '../../config';

export class UpdateAnnouncementResourceDto {
  resourceType?: ResourceType;
  url?: string;
}

export interface AnnouncementResourceDto extends AnnouncementResource {
  announcement?: Announcement;
}
export class AnnouncementResourceObject {
  resourceType!: ResourceType;
  url!: string;
}

export class CreateAnnouncementDto {
  companyId!: number;
  title!: string;
  body!: string;
  active?: boolean;
  public?: boolean;
  publishDate!: Date;
  resources?: AnnouncementResourceObject[];
  targetGradeLevelIds?: number[];
}

export class UpdateAnnouncementDto {
  title?: string;
  body?: string;
  active?: boolean;
  public?: boolean;
  publishDate?: Date;
  addResources?: AnnouncementResourceObject[];
  removeResourcesIds?: number[];
  unassignedTargetGradeLevelIds?: number[];
  assignedTargetGradeLevelIds?: number[];
}

export enum AnnouncementOrderBy {
  TITLE_ASC = 'title:asc',
  TITLE_DESC = 'title:desc',
  PUBLISH_DATE_ASC = 'publishDate:asc',
  PUBLISH_DATE_DESC = 'publishDate:desc',
  CREATED_AT_ASC = 'createdAt:asc',
  CREATED_AT_DESC = 'createdAt:desc',
  MODIFIED_AT_ASC = 'modifiedAt:asc',
  MODIFIED_AT_DESC = 'modifiedAt:desc',
}

export class QueryAnnouncementDto {
  companyId?: number;
  active?: boolean;
  public?: boolean;
  targetGradeLevelId?: number; 
  'publishDate.gte'?: string;
  'publishDate.lte'?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: AnnouncementOrderBy = AnnouncementOrderBy.CREATED_AT_DESC;
}

export interface AnnouncementDto extends Announcement {
  company?: PayrollCompany;
  resources?: AnnouncementResource[];
  targetGradeLevels?: GradeLevel[];
}

export class SearchAnnouncementDto {
  q?: string;
  page: number = 1;
  limit: number = config.pagination.limit;
  orderBy: AnnouncementOrderBy = AnnouncementOrderBy.CREATED_AT_DESC;
}