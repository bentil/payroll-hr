import { NextFunction, Request, Response } from 'express';
import { 
  EmployeeOvertimeEntryV1Controller 
} from './openapi/employee-overtime-entry-v1.oas.controller';
import { 
  QueryEmployeeOvertimeEntryDto, 
} from '../domain/dto/employee-overtime-entry.dto';

const controller = new EmployeeOvertimeEntryV1Controller();

export async function addNewEmployeeOvertimeEntry(
  req: Request, res: Response, next: NextFunction
) {
  try {
    const response = await controller.addEmployeeOvertimeEntry(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeOvertimeEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getEmployeeOvertimeEntries(
      req.query as unknown as QueryEmployeeOvertimeEntryDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeOvertimeEntry(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getEmployeeOvertimeEntry(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
export async function updateEmployeeOvertimeEntry(
  req: Request, res: Response, next: NextFunction
) {
  const { id } = req.params;
  try {
    const response = await controller.updateEmployeeOvertimeEntry(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeOvertimeEntry(
  req: Request, res: Response, next: NextFunction
) {
  const { id } = req.params;
  try {
    await controller.deleteEmployeeOvertimeEntry(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
