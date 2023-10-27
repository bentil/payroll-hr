import { NextFunction, Request, Response } from 'express';

import { GrievanceReportV1Controller } from './openapi/grievance-report-v1.oas.controller';
import { 
  QueryGrievanceReportDto, 
  SearchGrievanceReportDto 
} from '../domain/dto/grievance-report.dto';

const controller = new GrievanceReportV1Controller();

export const addNewGrievanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.addGrievanceReport(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const getGrievanceReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.getGrievanceReports(
      req.query as unknown as QueryGrievanceReportDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getGrievanceReport = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const response = await controller.getGrievanceReport(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
export const updateGrievanceReport = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const response = await controller.updateGrievanceReport(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const searchGrievanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.searchGrievanceReport(
      req.query as unknown as SearchGrievanceReportDto
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
};


export const deleteGrievanceReport = async ( req: Request, res: Response, next: NextFunction ) => {
  const { id } = req.params;
  try {
    await controller.deleteGrievanceReport(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
