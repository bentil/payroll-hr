import Joi from 'joi';
import joiDate from '@joi/date';
import coreJoi from 'joi';
import { REIMBURESEMENT_REQUEST_STATUS } from '@prisma/client';
import config from '../../config';
import { 
  REIMBURSEMENT_RESPONSE_ACTION, 
  ReimbursementRequestOrderBy 
} from '../dto/reimbursement-request.dto';

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_REIMBURSEMENT_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
  title: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title must not be blank',
      'any.required': 'Title field is required'
    }),
  description: Joi.string()
    .optional().default('')
    .trim(),
  currencyId: Joi.number()
    .required()
    .messages({
      'number.base': 'Currency id must be a number'
    }),
  amount: Joi.number()
    .required(),
  status: Joi.string()
    .optional()
    .default(REIMBURESEMENT_REQUEST_STATUS.SUBMITTED),
  expenditureDate: joi.date()
    .required()
    .less(Date.now())
    .format(['YYYY-MM-DD']),
  attachmentUrls: Joi.array().items(Joi.string().uri()).optional()
});

export const UPDATE_REIMBURSEMENT_REQUEST_SCHEMA = Joi.object({
  title: Joi.string()
    .optional()
    .trim(),
  description: Joi.string()
    .optional().default('')
    .trim(),
  currencyId: Joi.number()
    .optional(),
  amount: Joi.number()
    .optional(),
  expenditureDate: joi.date()
    .optional()
    .less(Date.now() + 24 * 60 * 60 * 1000)
    .format(['YYYY-MM-DD']),
}).or('title', 'description', 'currencyId', 'amount', 'expenditureDate');

export const QUERY_REIMBURSEMENT_REQUEST_SCHEMA = Joi.object({
  employeeId: Joi.number(),
  status: Joi.string()
    .optional()
    .valid(
      REIMBURESEMENT_REQUEST_STATUS.APPROVED,
      REIMBURESEMENT_REQUEST_STATUS.COMPLETED,
      REIMBURESEMENT_REQUEST_STATUS.QUERIED,
      REIMBURESEMENT_REQUEST_STATUS.REJECTED,
      REIMBURESEMENT_REQUEST_STATUS.SUBMITTED
    ),
  approverId: Joi.number().optional(),
  signerId: Joi.number().optional(),
  'expenditureDate.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'expenditureDate.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'createdAt.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'createdAt.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'approvedAt.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'approvedAt.lte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'completedAt.gte': joi.date().optional()
    .format('YYYY-MM-DD').utc().raw(),
  'completedAt.lte': joi.date().optional()
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
    .valid(...Object.values(ReimbursementRequestOrderBy))
    .default(ReimbursementRequestOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(ReimbursementRequestOrderBy)}`
    })
});

export const CREATE_REIMBURSEMENT_RESPONSE_SCHEMA = Joi.object({
  action: Joi.string()
    .required()
    .valid(
      REIMBURSEMENT_RESPONSE_ACTION.APPROVE,
      REIMBURSEMENT_RESPONSE_ACTION.QUERY,
      REIMBURSEMENT_RESPONSE_ACTION.REJECT
    ),
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
  attachmentUrls: Joi.array().optional()
});

export const REIMBURSEMENT_REQUEST_UPDATES_SCHEMA = Joi.object({
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
  attachmentUrls: Joi.array().optional()
});

export const COMPLETE_REIMBURSEMENT_REQUEST_SCHEMA = Joi.object({
  comment: Joi.string()
    .optional()
    .allow('')
    .default('')
    .trim(),
});
