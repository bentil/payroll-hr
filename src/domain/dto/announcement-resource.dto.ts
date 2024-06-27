import { ResourceType } from '@prisma/client';

export class UpdateAnnouncementResourceDto {
  resourceType?: ResourceType;
  url?: string;
}