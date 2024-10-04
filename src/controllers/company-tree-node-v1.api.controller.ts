import { NextFunction, Request, Response } from 'express';
import { 
  DeleteCompanyTreeNodeQueryDto, 
  SupervisorInfoQueryDto 
} from '../domain/dto/company-tree-node.dto';
import {
  CompanyTreeNodeV1Controller
} from './openapi/company-tree-node-v1.oas.controller';


const controller = new CompanyTreeNodeV1Controller();

export async function addNewCompanyTreeNode(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.addCompanyTreeNode(
      +companyId,
      req.body,
      req,
    );
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTree(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getCompanyTree(+companyId, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTreeNode(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.getCompanyTreeNode(
      +companyId,
      +nodeId,
      req,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyTreeNode(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.updateCompanyTreeNode(
      +companyId,
      +nodeId,
      req.body,
      req,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function unlinkEmployee(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.unlinkEmployee(
      +companyId,
      +nodeId,
      req,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompanyTreeNode(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId, nodeId } = req.params;
  try {
    await controller.deleteCompanyTreeNode(
      +companyId,
      +nodeId,
      req.query as unknown as DeleteCompanyTreeNodeQueryDto,
      req,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSupervisionInfo(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { companyId } = req.params;
  try {
    const response = await controller.getSupervisionInfo(
      +companyId,
      req.query as unknown as SupervisorInfoQueryDto,
      req,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}
