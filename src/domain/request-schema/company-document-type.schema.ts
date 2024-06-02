import Joi from 'joi';
import config from '../../config';
import { CompanyDocumentTypeOrderBy } from '../dto/company-document-type.dto';

export const CREATE_COMPANY_DOCUMENT_TYPE_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Company Id must be a number'
    }),
  description: Joi.string()
    .optional()
    .default('')
    .trim()
    .messages({
      'string.base': 'Description must be a string'
    }),
  name: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Name must be a string'
    })
});

export const UPDATE_COMPANY_DOCUMENT_TYPE_SCHEMA = Joi.object({
  description: Joi.string().optional().trim(),
  name: Joi.string().optional().trim(),
}).or('description', 'name');

export const QUERY_COMPANY_DOCUMENT_TYPE_SCHEMA = Joi.object({
  companyId: Joi.number()
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
    .valid(
      ...Object.values(CompanyDocumentTypeOrderBy)
    )
    .default(CompanyDocumentTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(CompanyDocumentTypeOrderBy)}`
    })
});

export const SEARCH_COMPANY_DOCUMENT_TYPE_SCHEMA = Joi.object({
  q: Joi.string().trim().required(),
  companyId: Joi.number()
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
    .valid(
      ...Object.values(CompanyDocumentTypeOrderBy)
    )
    .default(CompanyDocumentTypeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(CompanyDocumentTypeOrderBy)}`
    })
});