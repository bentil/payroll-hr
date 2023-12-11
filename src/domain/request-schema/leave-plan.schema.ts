import config from '../../config';
import { LeavePlanOrderBy } from '../dto/leave-plan.dto'; 
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_LEAVE_PLAN_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
  leaveTypeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Leave type id must be a number'
    }),
  intendedStartDate: joi.date()
    .required()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  intendedReturnDate: joi.date()
    .required()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
});

export const UPDATE_LEAVE_PLAN_SCHEMA = Joi.object({
  leaveTypeId: Joi.number()
    .optional(),
  intendedStartDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  intendedReturnDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  comment: Joi.string()
    .optional()
    .allow('')
    .trim(),
}).or('leavePackageId', 'comment', 'intendedStartDate', 'intendedReturnDate');

export const QUERY_LEAVE_PLAN_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  leavePackageId: Joi.number(),
  'intendedStartDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'intendedStartDate.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'intendedReturnDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'intendedReturnDate.lte': joi.date().optional()
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
    .valid(...Object.values(LeavePlanOrderBy))
    .default(LeavePlanOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeavePlanOrderBy)}`
    })
});