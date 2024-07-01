import { ResourceType } from '@prisma/client';
import config from '../../config';
import { AnnouncementOrderBy } from '../dto/announcement.dto';
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const UPDATE_ANNOUNCEMENT_RESOURCE_SCHEMA = Joi.object({
  resourceType: Joi.string().optional().valid(...Object.values(ResourceType)),
  url: Joi.string().uri().optional(),
}).or('resourceType', 'url');

export const ANNOUNCEMENT_RESOURCE_OBJECT_SCHEMA = Joi.object({
  resourceType: Joi.string().valid(...Object.values(ResourceType)),
  url: Joi.string().uri().required()
});

export const CREATE_ANNOUNCEMENT_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  title: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Title must be a string'
    }),
  body: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Body must be a string'
    }),
  active: Joi.boolean()
    .optional()
    .valid(true, false)
    .default(true),
  public: Joi.boolean()
    .optional()
    .valid(true, false)
    .default(false),
  publishDate: joi.date()
    .format(['YYYY-MM-DD'])
    .required(),
  resources: Joi.array().items(ANNOUNCEMENT_RESOURCE_OBJECT_SCHEMA).optional(),
  targetGradeLevelIds: Joi.array()
    .when('public', {
      is: false, then: Joi.array().required().items(Joi.number()).messages({
        'any.required': 'Target grade level is required when public is false',
      }), otherwise: Joi.array().optional().default([null])
    }),
});

export const UPDATE_ANNOUNCEMENT_SCHEMA = Joi.object({
  title: Joi.string().optional(),
  body: Joi.string().optional(),
  active: Joi.boolean().optional(),
  public: Joi.boolean().optional(),
  publishDate: Joi.date().optional(),
  addResources: Joi.array().items(ANNOUNCEMENT_RESOURCE_OBJECT_SCHEMA).optional(),
  removeResourcesIds: Joi.array().optional().items(Joi.number()),
  unassignedTargetGradeLevelIds: Joi.array().optional().items(Joi.number()),
  assignedTargetGradeLevelIds: Joi.array()
    .when('public', {
      is: false, then: Joi.array().required().items(Joi.number()).messages({
        'any.required': 'Target grade levels is required when public is false',
      }), otherwise: Joi.array().optional()
    }),
}).or(
  'title', 'body', 'active', 'public', 'publishDate', 'addResources', 
  'removeResources', 'unassignedTargetGradeLevelIds', 'assignedTargetGradeLevelIds'
);

export const QUERY_ANNOUNCEMENT_SCHEMA = Joi.object({
  companyId: Joi.number().optional(), 
  active: Joi.bool().valid(true, false).optional(),
  public: Joi.bool().valid(true, false).optional(),
  targetGradeLevelId: Joi.number().optional(), 
  'publishDate.gte': joi.date().optional()
    .format(['YYYY-MM-DD']).utc().raw(),
  'publishDate.lte': joi.date().optional()
    .format(['YYYY-MM-DD']).utc().raw(),
  page: Joi.number().optional()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'page must be more than or equal to 1'
    }),
  limit: Joi.number().optional()
    .min(1)
    .default(config.pagination.limit)
    .messages({
      'number.min': 'limit must be more than or equal to 1'
    }),
  orderBy: Joi.string().optional()
    .valid(...Object.values(AnnouncementOrderBy))
    .default(AnnouncementOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(AnnouncementOrderBy)}`
    })
});

export const QUERY_EMPLOYEE_ANNOUNCEMENT_SCHEMA = Joi.object({
  'publishDate.gte': joi.date().optional()
    .format(['YYYY-MM-DD']).utc().raw(),
  'publishDate.lte': joi.date().optional()
    .format(['YYYY-MM-DD']).utc().raw(),
  page: Joi.number().optional()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'page must be more than or equal to 1'
    }),
  limit: Joi.number().optional()
    .min(1)
    .default(config.pagination.limit)
    .messages({
      'number.min': 'limit must be more than or equal to 1'
    }),
  orderBy: Joi.string().optional()
    .valid(...Object.values(AnnouncementOrderBy))
    .default(AnnouncementOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(AnnouncementOrderBy)}`
    })
});

export const SEARCH_ANNOUNCEMENT_SCHEMA = Joi.object({
  q: Joi.string().required().trim(),
  page: Joi.number().optional()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'page must be more than or equal to 1'
    }),
  limit: Joi.number().optional()
    .min(1)
    .default(config.pagination.limit)
    .messages({
      'number.min': 'limit must be more than or equal to 1'
    }),
  orderBy: Joi.string().optional()
    .valid(...Object.values(AnnouncementOrderBy))
    .default(AnnouncementOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(AnnouncementOrderBy)}`
    })
});
