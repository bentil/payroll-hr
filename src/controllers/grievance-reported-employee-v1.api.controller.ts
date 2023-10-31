import { NextFunction, Request, Response } from 'express';

import {
  ReportedEmployeeV1Controller 
} from './openapi/grievance-reported-employee-v1.oas.controller';


const controller = new ReportedEmployeeV1Controller();

export async function addNewReportedEmployee(req: Request, res: Response, next: NextFunction) {
  const { reportId } = req.params;
  try {
    const response = await controller.addGrievanceType(req.body, +reportId);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteReportedEmployee( req: Request, res: Response, next: NextFunction ) {
  const { reportId, employeeId } = req.params;
  try {
    await controller.deleteGrievanceType(+reportId, +employeeId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
