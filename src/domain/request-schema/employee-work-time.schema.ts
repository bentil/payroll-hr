import Joi from 'joi';
import config from '../../config';
import { EmployeeWorkTimeOrderBy } from '../dto/employee-work-time.dto';
import { WorkTimeUnit } from '@prisma/client';

export const CREATE_EMPLOYEE_WORK_TIME_SCHEMA = Joi.object({
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

export const UPDATE_EMPLOYEE_WORK_TIME_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .optional(),
  payPeriodId: Joi.number()
    .optional(),
  timeUnit: Joi.string()
    .optional()
    .valid(...Object.values(WorkTimeUnit)),
  timeValue: Joi.number()
    .optional()
}).or('employeeId', 'payPeriodId', 'timeUnit', 'timeValue');

export const QUERY_EMPLOYEE_WORK_TIME_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  payPeriodId: Joi.number(),
  timeUnit: Joi.string().valid(...Object.values(WorkTimeUnit)),
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
    .valid(...Object.values(EmployeeWorkTimeOrderBy))
    .default(EmployeeWorkTimeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(EmployeeWorkTimeOrderBy)}`
    })
});