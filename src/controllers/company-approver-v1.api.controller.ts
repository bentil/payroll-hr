import { NextFunction, Request, Response } from 'express';
import { CompanyApproverV1Controller } from './openapi/company-approver-v1.oas.controller';
import { 
  QueryCompanyApproverDto 
} from '../domain/dto/company-approver.dto';

const controller = new CompanyApproverV1Controller();

export async function addCompanyApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.addCompanyApprover(+companyId, req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyApprovers(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getCompanyApprovers(
      +companyId,
      req.query as unknown as QueryCompanyApproverDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, companyId } = req.params;
  try {
    const response = await controller.getCompanyApprover(
      +id, 
      +companyId, 
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, companyId } = req.params;
  try {
    const response = await controller.updateCompanyApprover(+id, +companyId, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompanyApprover(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id, companyId } = req.params;
  try {
    await controller.deleteCompanyApprover(+id, +companyId, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}