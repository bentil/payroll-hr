import Joi from 'joi';
import config from '../../config';
import { CompanyTreeNodeOrderBy } from '../dto/company-tree-node.dto';

const CHILD_NODE = Joi.object({
  jobTitleId: Joi.number()
    .required()
    .messages({ 'number.base': 'JobTitleId must be a number' }),
  employeeId: Joi.number()
    .optional()
    .messages({ 'number.base': 'EmployeeId must be a number' }),
});

export const CREATE_COMPANY_TREE_NODE = Joi.object({
  parentId: Joi.number()
    .optional()
    .messages({ 'number.base': 'ParentId must be a number' }),
  jobTitleId: Joi.number()
    .required()
    .messages({ 'number.base': 'JobTitleId must be a number' }),
  employeeId: Joi.number()
    .optional()
    .messages({ 'number.base': 'EmployeeId must be a number' }),
  childNodes: Joi.array().items(CHILD_NODE).optional()
});

export const UPDATE_COMPANY_TREE_NODE = Joi.object({
  parentId: Joi.number().optional(),
  employeeId: Joi.number().optional(),
}).or('parentId', 'employeeId');

export const QUERY_COMPANY_TREE_NODE = Joi.object({
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
    .valid(...Object.values(CompanyTreeNodeOrderBy))
    .default(CompanyTreeNodeOrderBy.CREATED_AT_DESC)
    .messages({
      'any.only': `orderBy must be one of these: ${Object.values(CompanyTreeNodeOrderBy)}`
    })
});