import config from '../../config';
import { ApplicableLeaveTypeOrderBy, LeaveTypeOrderBy } from '../dto/leave-type.dto';
import Joi from 'joi';

export const CREATE_LEAVE_TYPE_SCHEMA = Joi.object({
  code: Joi.string()
    .alphanum()
    .uppercase()
    .trim()
    .required(),
  name: Joi.string()
    .required(),
  colorCode: Joi.string()
    .required(),
  description: Joi.string()
    .optional().default('')
    .trim(),
});

export const UPDATE_LEAVE_TYPE_SCHEMA = Joi.object({
  code: Joi.string()
    .alphanum()
    .uppercase()
    .trim()
    .optional(),
  name: Joi.string()
    .optional(),
  colorCode: Joi.string()
    .optional(),
  description: Joi.string()
    .optional()
    .trim(),
}).or('code', 'name', 'description');

export const QUERY_APPLICABLE_LEAVE_TYPE_SCHEMA = Joi.object({
  employeeId: Joi.number().optional(),
  companyLevelId: Joi.number().optional(),
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
    .valid(...Object.values(LeaveTypeOrderBy))
    .default(ApplicableLeaveTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(ApplicableLeaveTypeOrderBy)}`
    })
}).or('employeeId', 'companyLevelId');

export const QUERY_LEAVE_TYPE_SCHEMA = Joi.object({
  code: Joi.string()
    .optional(),
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
    .valid(...Object.values(LeaveTypeOrderBy))
    .default(LeaveTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeaveTypeOrderBy)}`
    })
});

export const SEARCH_LEAVE_TYPE_SCHEMA = Joi.object({
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
    .valid(...Object.values(LeaveTypeOrderBy))
    .default(LeaveTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeaveTypeOrderBy)}`
    })
});

export const INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA = Joi.object({
  includeCompanyLevels: Joi.boolean()
    .optional()
    .valid(true, false)
});