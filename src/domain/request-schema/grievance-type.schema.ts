import Joi from 'joi';
import config from '../../config';
import { GrievanceTypeOrderBy } from '../dto/grievance-type.dto';

export const CREATE_GRIEVANCE_TYPE_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  code: Joi.string()
    .alphanum()
    .uppercase()
    .required()
    .trim()
    .messages({
      'string.base': 'code must be a string',
      'string.empty': 'code must not be blank',
      'any.required': 'code field is required'
    }),
  name: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'name must be a string',
      'string.empty': 'name must not be blank',
      'any.required': 'name field is required'
    }),
  description: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'description must be a string',
      'string.empty': 'description must not be blank',
      'any.required': 'description field is required'
    }),
});

export const UPDATE_GRIEVANCE_TYPE_SCHEMA = Joi.object({
  code: Joi.string()
    .optional()
    .trim(),
  name: Joi.string()
    .optional()
    .trim(),
  description: Joi.string()
    .optional()
    .trim(),
}).or('code', 'name', 'description');

export const QUERY_GRIEVANCE_TYPE_SCHEMA = Joi.object({
  companyId: Joi.number(),
  code: Joi.string()
    .alphanum()
    .uppercase()
    .trim(),
  page: Joi.number()
    .optional()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'page must be more than or equal to 1'
    }),
  limit: Joi.number()
    .optional()
    .min(1)
    .default(config.pagination.limit)
    .messages({
      'number.min': 'limit must be more than or equal to 1'
    }),
  orderBy: Joi.string()
    .optional()
    .valid(...Object.values(GrievanceTypeOrderBy))
    .default(GrievanceTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(GrievanceTypeOrderBy)}`
    })
});

export const SEARCH_GRIEVANCE_TYPE_SCHEMA = Joi.object({
  q: Joi.string().trim().required(),
  page: Joi.number()
    .optional()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'page must be more than or equal to 1'
    }),
  limit: Joi.number()
    .optional()
    .min(1)
    .default(config.pagination.limit)
    .messages({
      'number.min': 'limit must be more than or equal to 1'
    }),
  orderBy: Joi.string()
    .optional()
    .valid(...Object.values(GrievanceTypeOrderBy))
    .default(GrievanceTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(GrievanceTypeOrderBy)}`
    })
});