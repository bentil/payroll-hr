import Joi from 'joi';
import config from '../../config';
import { CompanyLevelLeavePackageOrderBy } from '../dto/company-level-leave-package.dto';

export const CREATE_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA = Joi.object({
  companyLevelId: Joi.number()
    .required(),
  leavePackageIds: Joi.array()
    .required()
});


export const QUERY_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA = Joi.object({
  companyLevelId: Joi.number()
    .optional(),
  leavePackageId: Joi.number()
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
      ...Object.values(CompanyLevelLeavePackageOrderBy)
    )
    .default(CompanyLevelLeavePackageOrderBy.LEAVE_PACKAGE_CREATED_AT_ASC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(CompanyLevelLeavePackageOrderBy)}`
    })
});
