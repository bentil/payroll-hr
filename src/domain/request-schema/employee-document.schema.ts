import Joi from 'joi';
import config from '../../config';
import { EmployeeDocumentOrderBy } from '../dto/employee-document.dto';

export const CREATE_EMPLOYEE_DOCUMENT_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  typeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Type id must be a number'
    }),
  url: Joi.string()
    .required()
    .uri()
    .trim()
    .messages({
      'string.base': 'URL must be a string'
    })
});

export const UPDATE_EMPLOYEE_DOCUMENT_SCHEMA = Joi.object({
  employeeId: Joi.number().optional(),
  typeId: Joi.number().optional(),
  url: Joi.string()
    .optional()
    .uri()
    .trim()
}).or('employeeId', 'typeId', 'url');

export const QUERY_EMPLOYEE_DOCUMENT_SCHEMA = Joi.object({
  employeeId: Joi.number().optional(),
  typeId: Joi.number().optional(),
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
    .valid(
      ...Object.values(EmployeeDocumentOrderBy)
    )
    .default(EmployeeDocumentOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(EmployeeDocumentOrderBy)}`
    })
});