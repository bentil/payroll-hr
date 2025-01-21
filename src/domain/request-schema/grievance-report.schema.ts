import config from '../../config';
import { GrievanceReportOrderBy } from '../dto/grievance-report.dto'; 
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';
import { RequestQueryMode } from '../dto/leave-request.dto';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_GRIEVANCE_REPORT_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  grievanceTypeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Grievance Type Id must be a number'
    }),
  reportingEmployeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Reporting Employee Id must be a number'
    }),
  reportDate: joi.date()
    .required()
    .less('now')
    .format(['YYYY-MM-DD']),
  note: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'note must be a string',
      'string.empty': 'note must not be blank',
      'any.required': 'note field is required'
    }),
  reportedEmployeeId: Joi.array()
    .optional(),
  private: Joi.boolean().optional(),
});

export const CREATE_GRIEVANCE_REPORTED_EMPLOYEE_SCHEMA = Joi.object({
  reportedEmployeeIds: Joi.array()
    .required()
});

export const UPDATE_GRIEVANCE_REPORT_SCHEMA = Joi.object({
  grievanceTypeId: Joi.number()
    .optional(),
  reportDate: joi.date()
    .optional()
    .less('now')
    .format(['YYYY-MM-DD']),
  note: Joi.string()
    .optional(),
  private: Joi.boolean().optional(),
}).or(
  'grievanceTypeId', 'reportDate', 'note', 'private'
);

export const QUERY_GRIEVANCE_REPORT_SCHEMA = Joi.object({
  companyId: Joi.number(),
  reportingEmployeeId: Joi.number(),
  reportedEmployeeId: Joi.array().items(joi.number()).single(),
  grievanceTypeId: Joi.number(),
  'createdAt.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'createdAt.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  queryMode: Joi.string()
    .valid(...Object.values(RequestQueryMode)),
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
    .valid(...Object.values(GrievanceReportOrderBy))
    .default(GrievanceReportOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(GrievanceReportOrderBy)}`
    })
});

export const SEARCH_GRIEVANCE_REPORT_SCHEMA = Joi.object({
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
    .valid(...Object.values(GrievanceReportOrderBy))
    .default(GrievanceReportOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(GrievanceReportOrderBy)}`
    })
});