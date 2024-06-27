import { ResourceType } from '@prisma/client';
import Joi from 'joi';

export const UPDATE_ANNOUNCEMENT_RESOURCE_SCHEMA = Joi.object({
  resourceType: Joi.string().optional().valid(...Object.values(ResourceType)),
  url: Joi.string().uri().optional(),
}).or('resourceType', 'url');