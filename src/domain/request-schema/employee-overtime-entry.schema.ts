import Joi from 'joi';
import config from '../../config';
import { EmployeeOvertimeEntryOrderBy } from '../dto/employee-overtime-entry.dto';

export const CREATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA = Joi.object({
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
  overtimeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Overtime id must be a number'
    }),
  numberOfHours: Joi.number()
    .required()
    .messages({
      'number.base': 'Number of hours must be a number',
    })
});

export const UPDATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .optional(),
  payPeriodId: Joi.number()
    .optional(),
  overtimeId: Joi.number()
    .optional(),
  numberOfHours: Joi.number()
    .optional()
}).or('employeeId', 'payPeriodId', 'overtimeId', 'numberOfHours');

export const QUERY_EMPLOYEE_OVERTIME_ENTRY_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  payPeriodId: Joi.number(),
  overtimeId: Joi.number(),
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
    .valid(...Object.values(EmployeeOvertimeEntryOrderBy))
    .default(EmployeeOvertimeEntryOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(EmployeeOvertimeEntryOrderBy)}`
    })
});