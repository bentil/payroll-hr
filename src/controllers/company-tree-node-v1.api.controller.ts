import { NextFunction, Request, Response } from 'express';

import { CompanyTreeNodeV1Controller } from './openapi/company-tree-node-v1.oas.controller';
import { DeleteCompanyTreeNodeQueryDto } from '../domain/dto/company-tree-node.dto';

const controller = new CompanyTreeNodeV1Controller();

export async function addNewCompanyTreeNode(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.addCompanyTreeNode(req.body, +id);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTree(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getCompanyTree(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTreeNode(req: Request, res: Response, next: NextFunction) {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.getCompanyTreeNode(+companyId, +nodeId);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyTreeNode(req: Request, res: Response, next: NextFunction) {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.updateCompanyTreeNode(+companyId, +nodeId, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function unlinkEmployee(req: Request, res: Response, next: NextFunction) {
  const { companyId, nodeId } = req.params;
  try {
    const response = await controller.unlinkEmployee(+companyId, +nodeId);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompanyTreeNode( req: Request, res: Response, next: NextFunction ) {
  const { companyId, nodeId } = req.params;
  try {
    await controller.deleteCompanyTreeNode(
      +companyId, +nodeId, req.query as unknown as DeleteCompanyTreeNodeQueryDto
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
