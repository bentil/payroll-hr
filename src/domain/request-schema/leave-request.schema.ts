import config from '../../config';
import { LeaveRequestOrderBy } from '../dto/leave-request.dto'; 
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';
import { LEAVE_REQUEST_STATUS, LEAVE_RESPONSE_TYPE } from '@prisma/client';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_LEAVE_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
  leavePackageId: Joi.number()
    .required()
    .messages({
      'number.base': 'Leave package id must be a number'
    }),
  startDate: joi.date()
    .required()
    .greater(Date.now())
    .format(['YYYY/MM/DD']),
  returnDate: joi.date()
    .required()
    .greater(Date.now())
    .format(['YYYY/MM/DD']),
  comment: Joi.string()
    .optional()
    .default('')
    .trim(),
  status: Joi.string()
    .optional()
    .default(LEAVE_REQUEST_STATUS.PENDING)
    .valid(
      LEAVE_REQUEST_STATUS.APPROVED,
      LEAVE_REQUEST_STATUS.CANCELLED,
      LEAVE_REQUEST_STATUS.DECLINED,
      LEAVE_REQUEST_STATUS.PENDING
    )
});

export const UPDATE_LEAVE_REQUEST_SCHEMA = Joi.object({
  leavePackageId: Joi.number()
    .optional(),
  startDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY/MM/DD']),
  returnDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY/MM/DD']),
  comment: Joi.string()
    .optional()
    .allow('')
    .trim(),
}).or('leavePackageId', 'startDate', 'returnDate', 'comment');

export const QUERY_LEAVE_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  leavePackageId: Joi.number(),
  'startDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'startDate.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'returnDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'returnDate.lte': joi.date().optional()
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
    .valid(...Object.values(LeaveRequestOrderBy))
    .default(LeaveRequestOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(LeaveRequestOrderBy)}`
    })
});

export const CREATE_LEAVE_RESPONSE_SCHEMA = Joi.object({
  action: Joi.string()
    .required()
    .valid(
      LEAVE_RESPONSE_TYPE.APPROVED,
      LEAVE_RESPONSE_TYPE.DECLINED
    ),
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
});
