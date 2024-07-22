import Joi from 'joi';
import config from '../../config';
import { EmployeeApproverOrderBy } from '../dto/employee-approver.dto';

export const CREATE_EMPLOYEE_APPROVER_SCHEMA = Joi.object({
  approverId: Joi.number()
    .required()
    .messages({
      'number.base': 'Approver Id must be a number'
    }),
  level: Joi.number()
    .required()
    .min(1)
    .messages({
      'number.base': 'Level must be a number'
    }),
});

export const UPDATE_EMPLOYEE_APPROVER_SCHEMA = Joi.object({
  approverId: Joi.number().optional(),
  level: Joi.number().optional(),
}).or('approverId', 'level');

export const QUERY_EMPLOYEE_APPROVER_SCHEMA = Joi.object({
  approverId: Joi.number().optional().when(
    'inverse', {
      is:  true, then: Joi.number().forbidden().messages({
        'any.forbidden': 'Approver id is not allowed when inverse is true',
      }), otherwise: Joi.number().optional()
    }
  ),
  level: Joi.number().optional(),
  inverse: Joi.boolean().valid(true, false).optional(),
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
      ...Object.values(EmployeeApproverOrderBy)
    )
    .default(EmployeeApproverOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(EmployeeApproverOrderBy)}`
    })
});

export const GET_ONE_EMPLOYEE_APPROVER_SCHEMA = Joi.object({
  inverse: Joi.boolean().valid(true, false).optional(),
});