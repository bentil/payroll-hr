import Joi from 'joi';
import config from '../../config';
import { CompanyApproverOrderBy } from '../dto/company-approver.dto';
import { ApproverType } from '@prisma/client';

export const CREATE_COMPANY_APPROVER_SCHEMA = Joi.object({
  approverType: Joi.string()
    .required()
    .valid(...Object.values(ApproverType)),
  companyLevelId: Joi.number()
    .optional()
    .when('approverType', {
      is: ApproverType.MANAGER, then: Joi.number().required().messages({
        'any.required': 'Company level id is required if Approver Type specified is manager',
      }),
      otherwise: Joi.number().optional()
    }),
  level: Joi.number()
    .required()
    .min(1)
    .messages({
      'number.base': 'Level must be a number'
    }),
});

export const UPDATE_COMPANY_APPROVER_SCHEMA = Joi.object({
  approverType: Joi.string()
    .optional()
    .valid(...Object.values(ApproverType)),
  companyLevelId: Joi.number()
    .optional()
    .when('approverType', {
      is: ApproverType.MANAGER, then: Joi.number().required().messages({
        'any.required': 'Company level id is required if Approver Type specified is manager',
      }),
      otherwise: Joi.number().optional()
    }),
  level: Joi.number()
    .optional,
}).or('approverType', 'level', 'companyLevelId');

export const QUERY_COMPANY_APPROVER_SCHEMA = Joi.object({
  approverType: Joi.number()
    .optional()
    .valid(...Object.values(ApproverType)),
  level: Joi.number().optional(),
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
    .valid(...Object.values(CompanyApproverOrderBy))
    .default(CompanyApproverOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(CompanyApproverOrderBy)}`
    })
});
