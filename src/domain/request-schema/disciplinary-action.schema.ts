import Joi from 'joi';
import config from '../../config';
import { DisciplinaryActionOrderBy } from '../dto/disciplinary-action.dto';
import joiDate from '@joi/date';
import coreJoi from 'joi';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_DISCIPLINARY_ACTION_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
  actionTypeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Action Type Id must be a number'
    }),
  grievanceReportId: Joi.number()
    .optional()
    .messages({
      'number.base': 'Grievance Report Id must be a number'
    }),
  notes: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'notes must be a string',
      'string.empty': 'notes must not be blank',
      'any.required': 'notes field is required'
    }),
  actionDate: joi.date()
    .required()
    .format(['YYYY-MM-DD']),
});
///change date format from / to -
export const UPDATE_DISCIPLINARY_ACTION_SCHEMA = Joi.object({
  actionTypeId: Joi.number()
    .optional(),
  grievanceReportId: Joi.number()
    .optional(),
  notes: Joi.string()
    .optional(),
  actionDate: joi.date()
    .optional()
    .format(['YYYY-MM-DD']),
}).or('actionTypeId', 'grievanceReportId', 'notes', 'actionDate');

export const QUERY_DISCIPLINARY_ACTION_SCHEMA = Joi.object({
  companyId: Joi.number(),
  employeeId: Joi.number(),
  actionTypeId: Joi.number(),
  grievanceReportId: Joi.number(),
  'actionDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'actionDate.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
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
    .valid(...Object.values(DisciplinaryActionOrderBy))
    .default(DisciplinaryActionOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(DisciplinaryActionOrderBy)}`
    })
});

export const SEARCH_DISCIPLINARY_ACTION_SCHEMA = Joi.object({
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
    .valid(...Object.values(DisciplinaryActionOrderBy))
    .default(DisciplinaryActionOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(DisciplinaryActionOrderBy)}`
    })
});

export const QUERY_DISCIPLINARY_ACTIONS_REPORT_SCHEMA = Joi.object({
  'actionDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'actionDate.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
});

export const EXPORT_DISCIPLINARY_ACTION_QUERY_SCHEMA = Joi.object({
  employeeNumber: Joi.boolean()
    .optional()
    .valid(true, false),
  actionTypeCode: Joi.boolean()
    .optional()
    .valid(true, false),
  actionNumber: Joi.boolean()
    .optional()
    .valid(true, false),
  grievanceReportNumber: Joi.boolean()
    .optional()
    .valid(true, false),
  notes: Joi.boolean()
    .optional()
    .valid(true, false),
  actionDate: Joi.boolean()
    .optional()
    .valid(true, false),
  orderBy: Joi.string()
    .optional()
    .valid(...Object.values(DisciplinaryActionOrderBy))
    .default(DisciplinaryActionOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(DisciplinaryActionOrderBy)}`
    })
}).or(
  'employeeNumber', 'actionTypeCode', 'actionNumber', 'grievanceReportCode', 'notes', 'actionDate'
);