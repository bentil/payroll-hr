import { NextFunction, Request, Response } from 'express';
import { 
  EmployeeWorkTimeV1Controller 
} from './openapi/employee-work-time-v1.oas.controller';
import { 
  QueryEmployeeWorkTimeDto, 
} from '../domain/dto/employee-work-time.dto';

const controller = new EmployeeWorkTimeV1Controller();

export async function addNewEmployeeWorkTime(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addEmployeeWorkTime(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeWorkTimes(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getEmployeeWorkTimes(
      req.query as unknown as QueryEmployeeWorkTimeDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeWorkTime(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getEmployeeWorkTime(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
export async function updateEmployeeWorkTime(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateEmployeeWorkTime(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeWorkTime(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteEmployeeWorkTime(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
