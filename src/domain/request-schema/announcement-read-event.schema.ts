import joiDate from '@joi/date';
import coreJoi from 'joi';

const Joi = coreJoi.extend(joiDate) as typeof coreJoi;

export const CREATE_ANNOUNCEMENT_READ_EVENT_SCHEMA = Joi.object({
  employeeId: Joi.number()
    .required()
    .messages({
      'number.base': 'Employee Id must be a number'
    }),
});
