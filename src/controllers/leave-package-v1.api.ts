import { NextFunction, Request, Response } from 'express';
import { LeavePackageV1Controller } from './openapi/leave-package.v1.oas.controller';
import { QueryLeavePackageDto, SearchLeavePackageDto } from '../domain/dto/leave-package.dto';
import { IncludeCompanyLevelsQueryDto } from '../domain/dto/leave-type.dto';

const controller = new LeavePackageV1Controller();

export async function addLeavePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addLeavePackage(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateLeavePackage(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateLeavePackage(Number(id), req.body/*, req*/);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listLeavePackages(req: Request, res: Response, next: NextFunction) {
  const { query } = req;
  try {
    const response = await controller.getLeavePackages(
      query as unknown as QueryLeavePackageDto,
      req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchLeavePackages(req: Request, res: Response, next: NextFunction) {
  const { query } = req;
  try {
    const response = await controller.searchLeavePackage(
      query as unknown as SearchLeavePackageDto,
      req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavePackageById(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { query } = req;

  try {
    const response = await controller.getLeavePackageById(Number(id),
      query as unknown as IncludeCompanyLevelsQueryDto/*, req*/);
    res.json(response);
  } catch (err) {
    return next(err);
  }
}

export async function deleteLeavePackage(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.deleteLeavePackage(Number(id), req);
    res.status(204).json(response);
  } catch (err) {
    return next(err);
  }
}
