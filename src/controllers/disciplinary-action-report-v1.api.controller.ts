import { NextFunction, Request, Response } from 'express';
import { 
  DisciplinaryActionsReportV1Controller 
} from './openapi/disciplinary-action-report-v1.oas.controller';
import { 
  QueryDisciplinaryActionReportDto, 
} from '../domain/dto/disciplinary-action.dto';

const controller = new DisciplinaryActionsReportV1Controller();


export async function getDisciplinaryActionsReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { comapnyId } = req.params;
  try {
    const response = await controller.getDisciplinaryActionsReport(
      +comapnyId,
      req.query as unknown as QueryDisciplinaryActionReportDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplinaryActionsForEmployeeReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { comapnyId, employeeId } = req.params;
  try {
    const response = await controller.getDisciplinaryActionsForEmployeeReport(
      +comapnyId,
      +employeeId,
      req.query as unknown as QueryDisciplinaryActionReportDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}
