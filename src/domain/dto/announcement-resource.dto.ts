import { Announcement, AnnouncementResource, ResourceType } from '@prisma/client';

export class UpdateAnnouncementResourceDto {
  resourceType?: ResourceType;
  url?: string;
}

export interface AnnouncementResourceDto extends AnnouncementResource {
  announcement?: Announcement;
}