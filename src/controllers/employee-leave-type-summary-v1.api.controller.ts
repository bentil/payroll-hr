import { NextFunction, Request, Response } from 'express';
import { 
  EmployeeLeaveTypeSummaryV1Controller 
} from './openapi/employee-leave-type-summary-v1.oas.controller';

const controller = new EmployeeLeaveTypeSummaryV1Controller();

export async function getSummary(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { employeeId, leaveTypeId } = req.params;
  try {
    const response = await controller.getSummary(+employeeId, +leaveTypeId);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}