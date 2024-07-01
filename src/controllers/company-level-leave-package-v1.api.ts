import { NextFunction, Request, Response } from 'express';
import { 
  CompanyLevelLeavePackageV1Controller 
} from './openapi/company-level-leave-package-v1.oas.controller';
import { QueryCompanyLevelLeavePackageDto } from '../domain/dto/company-level-leave-package.dto';

const controller = new CompanyLevelLeavePackageV1Controller();

export async function addCompanyLevelLeavePackage(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addCompanyLevelLeavePackage(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listCompanyLevelLeavePackages(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { query } = req;
  try {
    const response = await controller.getCompanyLevelLeavePackages(
      query as unknown as QueryCompanyLevelLeavePackageDto/*, req*/);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyLevelLeavePackageById(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getCompanyLevelLeavePackageById(Number(id)/*, req*/);
    res.json(response);
  } catch (err) {
    return next(err);
  }
}

export async function deleteCompanyLevelLeavePackage(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.deleteCompanyLevelLeavePackage(Number(id)/*, req*/);
    res.status(204).json(response);
  } catch (err) {
    return next(err);
  }
}
