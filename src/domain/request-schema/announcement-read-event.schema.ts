import config from '../../config';
import joiDate from '@joi/date';
import coreJoi from 'joi';

const Joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_ANNOUNCEMENT_READ_EVENT_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
});

export const QUERY_READ_EVENTS_SUMMARY_SCHEMA = Joi.object({
  companyId: Joi.number().required(), 
  active: Joi.bool().valid(true, false).optional(),
  public: Joi.bool().valid(true, false).optional(),
  targetGradeLevelId: Joi.number().optional(), 
  'publishDate.gte': Joi.date().optional()
    .format(['YYYY-MM-DD']).utc().raw(),
  'publishDate.lte': Joi.date().optional()
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
});
