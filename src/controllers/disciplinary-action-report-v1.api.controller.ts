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
  const { companyId } = req.params;
  try {
    const response = await controller.getDisciplinaryActionsReport(
      +companyId,
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
  const { companyId, employeeId } = req.params;
  try {
    const response = await controller.getDisciplinaryActionsForEmployeeReport(
      +companyId,
      +employeeId,
      req.query as unknown as QueryDisciplinaryActionReportDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}
