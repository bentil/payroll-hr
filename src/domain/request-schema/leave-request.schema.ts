import config from '../../config';
import { 
  AdjustmentOptions, 
  LeaveResponseAction, 
  LeaveRequestOrderBy, 
  RequestQueryMode
} from '../dto/leave-request.dto'; 
import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';
import { LEAVE_REQUEST_STATUS } from '@prisma/client';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_LEAVE_REQUEST_SCHEMA = Joi.object({
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
  startDate: joi.date()
    .required()
    .format(['YYYY-MM-DD']),
  returnDate: joi.date()
    .required()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  comment: Joi.string()
    .optional()
    .default('')
    .trim(),
});

export const UPDATE_LEAVE_REQUEST_SCHEMA = Joi.object({
  leaveTypeId: Joi.number()
    .optional(),
  startDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  returnDate: joi.date()
    .optional()
    .greater(Date.now())
    .format(['YYYY-MM-DD']),
  comment: Joi.string()
    .optional()
    .allow('')
    .trim(),
}).or('leaveTypeId', 'startDate', 'returnDate', 'comment');

export const QUERY_LEAVE_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  leaveTypeId: Joi.number(),
  queryMode: Joi.string()
    .valid(...Object.values(RequestQueryMode)),
  status: Joi.string().valid(...Object.values(LEAVE_REQUEST_STATUS)),
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
    .valid(...Object.values(LeaveResponseAction)),
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
});

export const ADJUST_DAYS_SCHEMA = Joi.object({
  adjustment: Joi.string()
    .required()
    .valid(...Object.values(AdjustmentOptions)),
  count: Joi.number()
    .positive()
    .required(),
  comment: Joi.string()
    .required()
    .messages({
      'string.base': 'comment must be a string',
      'string.empty': 'comment must not be blank',
      'any.required': 'comment field is required'
    })
});