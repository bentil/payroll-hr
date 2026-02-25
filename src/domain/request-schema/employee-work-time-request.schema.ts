import Joi from 'joi';
import config from '../../config';
import { 
  EmployeeWorkTimeAction, 
  EmployeeWorkTimeRequestOrderBy 
} from '../dto/employee-work-time-request.dto';
import { Status, WorkTimeUnit } from '@prisma/client';
import { RequestQueryMode } from '../dto/leave-request.dto';

export const CREATE_EMPLOYEE_WORK_TIME_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
  payPeriodId: Joi.number()
    .required()
    .messages({
      'number.base': 'Pay period id must be a number'
    }),
  timeUnit: Joi.string()
    .required()
    .valid(...Object.values(WorkTimeUnit)),
  timeValue: Joi.number()
    .required()
    .messages({
      'number.base': 'time value must be a number',
    })
});

export const UPDATE_EMPLOYEE_WORK_TIME_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .optional(),
  payPeriodId: Joi.number()
    .optional(),
  timeUnit: Joi.string()
    .optional()
    .valid(...Object.values(WorkTimeUnit)),
  timeValue: Joi.number()
    .optional(),
  status: Joi.string()
    .optional()
    .valid(...Object.values(Status))
}).or('employeeId', 'payPeriodId', 'timeUnit', 'timeValue', 'status');

export const QUERY_EMPLOYEE_WORK_TIME_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  payPeriodId: Joi.number(),
  timeUnit: Joi.string().valid(...Object.values(WorkTimeUnit)),
  queryMode: Joi.string()
    .valid(...Object.values(RequestQueryMode)),
  companyId: Joi.number(),
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
    .valid(...Object.values(EmployeeWorkTimeRequestOrderBy))
    .default(EmployeeWorkTimeRequestOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(EmployeeWorkTimeRequestOrderBy)}`
    })
});

export const CREATE_EMPLOYEE_WORK_TIME_RESPONSE_SCHEMA = Joi.object({
  action: Joi.string()
    .required()
    .valid(...Object.values(EmployeeWorkTimeAction)),
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
});