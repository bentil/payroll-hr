import { NextFunction, Request, Response } from 'express';
import { EmployeeApproverV1Controller } from './openapi/employee-approver-v1.oas.controller';
import { 
  GetOneEmployeeApproverDto, 
  QueryEmployeeApproverDto 
} from '../domain/dto/employee-approver.dto';

const controller = new EmployeeApproverV1Controller();

export async function addEmployeeApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { employeeId } = req.params;
  try {
    const response = await controller.addEmployeeApprover(+employeeId, req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeApprovers(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { employeeId } = req.params;
  try {
    const response = await controller.getEmployeeApprovers(
      +employeeId,
      req.query as unknown as QueryEmployeeApproverDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, employeeId } = req.params;
  try {
    const response = await controller.getEmployeeApprover(
      +id, 
      +employeeId, 
      req.query as GetOneEmployeeApproverDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, employeeId } = req.params;
  try {
    const response = await controller.updateEmployeeApprover(+id, +employeeId, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, employeeId } = req.params;
  try {
    await controller.deleteEmployeeApprover(+id, +employeeId, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
