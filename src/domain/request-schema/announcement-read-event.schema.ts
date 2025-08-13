import config from '../../config';
import { AnnouncementReadEventOrderBy } from '../dto/announcement-read-event.dto';
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_ANNOUNCEMENT_READ_EVENT_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
});


export const QUERY_ANNOUNCEMENT_READ_EVENT_SUMMARY_SCHEMA = Joi.object({
  companyId: Joi.number().required(), 
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
    .valid(...Object.values(AnnouncementReadEventOrderBy))
    .default(AnnouncementReadEventOrderBy.TIMESTAMP_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(AnnouncementReadEventOrderBy)}`
    })
});
