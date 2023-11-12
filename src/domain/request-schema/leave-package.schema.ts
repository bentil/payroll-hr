import config from '../../config';
import { LeavePackageOrderBy } from '../dto/leave-package.dto';
import Joi from 'joi';

export const CREATE_LEAVE_PACKAGE_SCHEMA = Joi.object({
  companyId: Joi.number()
    .required(),
  code: Joi.string()
    .required(),
  name: Joi.string()
    .required(),
  description: Joi.string()
    .optional().default('')
    .trim(),
  leaveTypeId: Joi.number()
    .required(),
  maxDays: Joi.number()
    .required(),
  paid: Joi.boolean()
    .optional()
    .valid(true, false),
  redeemable: Joi.boolean()
    .optional()
    .valid(true, false),
  accrued: Joi.boolean()
    .optional()
    .valid(true, false),
  carryOverDaysValue: Joi.number()
    .optional(),
  carryOverDaysPercent: Joi.number()
    .optional(),
  companyLevelIds: Joi.array()
    .optional()
});


export const UPDATE_LEAVE_PACKAGE_SCHEMA = Joi.object({
  code: Joi.string()
    .optional(),
  name: Joi.string()
    .optional(),
  description: Joi.string()
    .optional().default('')
    .trim(),
  leaveTypeId: Joi.number()
    .optional(),
  maxDays: Joi.number()
    .optional(),
  paid: Joi.boolean()
    .optional()
    .valid(true, false),
  redeemable: Joi.boolean()
    .optional()
    .valid(true, false),
  accrued: Joi.boolean()
    .optional()
    .valid(true, false),
  carryOverDaysValue: Joi.number()
    .optional(),
  carryOverDaysPercent: Joi.number()
    .optional(),
}).or('code', 'name', 'description', 'leaveTypeId', 'maxDays', 'paid', 'redeemable',
  'accrued', 'carryOverDaysValue', 'carryOverDaysPercent');


export const QUERY_LEAVE_PACKAGE_SCHEMA = Joi.object({
  companyId: Joi.string()
    .optional(),
  code: Joi.string()
    .optional(),
  leaveTypeId: Joi.string()
    .optional(),
  paid: Joi.string()
    .optional(),
  redeemablecode: Joi.string()
    .optional(),
  accrued: Joi.string()
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
      ...Object.values(LeavePackageOrderBy)
    )
    .default(LeavePackageOrderBy.CREATED_AT_ASC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeavePackageOrderBy)}`
    })
});

export const SEARCH_LEAVE_PACKAGE_SCHEMA = Joi.object({
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
    .valid(
      ...Object.values(LeavePackageOrderBy)
    )
    .default(LeavePackageOrderBy.CREATED_AT_ASC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeavePackageOrderBy)}`
    })
});
