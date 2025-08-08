import { NextFunction, Request, Response } from 'express';
import { LeaveReportV1Controller } from './openapi/leave-report-v1.oas.controller';
import { QueryLeaveRequestForReportDto } from '../domain/dto/leave-request.dto';

const controller = new LeaveReportV1Controller();


export async function getLeavesTaken(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getLeavesTaken(
      +companyId,
      req.query as unknown as QueryLeaveRequestForReportDto, 
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeLeavesTaken(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, employeeId } = req.params;
  try {
    const response = await controller.getEmployeeLeavesTaken(
      +companyId,
      +employeeId,
      req.query as unknown as QueryLeaveRequestForReportDto, 
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavesBalance(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getLeavesBalance(
      +companyId,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavesTakenPdf(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getLeavesTakenPdf(
      +companyId,
      req.query as unknown as QueryLeaveRequestForReportDto, 
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeLeavesTakenPdf(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, employeeId } = req.params;
  try {
    const response = await controller.getEmployeeLeavesTakenPdf(
      +companyId,
      +employeeId,
      req.query as unknown as QueryLeaveRequestForReportDto, 
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavesBalancePdf(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getLeavesBalancePdf(
      +companyId,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}