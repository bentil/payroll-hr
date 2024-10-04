import { NextFunction, Request, Response } from 'express';
import { GrievanceReportV1Controller } from './openapi/grievance-report-v1.oas.controller';
import { 
  QueryGrievanceReportDto, 
  SearchGrievanceReportDto 
} from '../domain/dto/grievance-report.dto';

const controller = new GrievanceReportV1Controller();

export async function addNewGrievanceReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addGrievanceReport(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceReports(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getGrievanceReports(
      req.query as unknown as QueryGrievanceReportDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getGrievanceReport(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateGrievanceReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateGrievanceReport(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchGrievanceReports(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchGrievanceReports(
      req.query as unknown as SearchGrievanceReportDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}


export async function deleteGrievanceReport(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteGrievanceReport(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
