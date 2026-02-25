import { NextFunction, Request, Response } from 'express';
import { 
  EmployeeWorkTimeRequestV1Controller 
} from './openapi/employee-work-time-request-v1.oas.controller';
import { QueryEmployeeWorkTimeRequestDto } from '../domain/dto/employee-work-time-request.dto';

const controller = new EmployeeWorkTimeRequestV1Controller();

export async function addNewEmployeeWorkTimeRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addEmployeeWorkTimeRequest(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeWorkTimeRequests(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getEmployeeWorkTimeRequests(
      req.query as unknown as QueryEmployeeWorkTimeRequestDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeWorkTimeRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getEmployeeWorkTimeRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeWorkTimeRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateEmployeeWorkTimeRequest(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeWorkTimeRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteEmployeeWorkTimeRequest(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addEmployeeWorkTimeResponse(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.addEmployeeWorkTimeResponse(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function cancelEmployeeWorkTimeRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.cancelEmployeeWorkTimeRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
