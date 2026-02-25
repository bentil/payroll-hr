import { NextFunction, Request, Response } from 'express';
import { 
  EmployeeOvertimeEntryRequestV1Controller 
} from './openapi/employee-overtime-entry-request-v1.oas.controller';
import { 
  QueryEmployeeOvertimeEntryRequestDto 
} from '../domain/dto/employee-overtime-entry-request.dto';

const controller = new EmployeeOvertimeEntryRequestV1Controller();

export async function addNewEmployeeOvertimeEntryRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addEmployeeOvertimeEntryRequest(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeOvertimeEntryRequests(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getEmployeeOvertimeEntryRequests(
      req.query as unknown as QueryEmployeeOvertimeEntryRequestDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeOvertimeEntryRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getEmployeeOvertimeEntryRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeOvertimeEntryRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateEmployeeOvertimeEntryRequest(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeOvertimeEntryRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteEmployeeOvertimeEntryRequest(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addEmployeeOvertimeEntryResponse(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.addEmployeeOvertimeEntryResponse(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function cancelEmployeeOvertimeEntryRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.cancelEmployeeOvertimeEntryRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
