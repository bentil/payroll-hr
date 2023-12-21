import { NextFunction, Request, Response } from 'express';

import { CompanyTreeNodeV1Controller } from './openapi/company-tree-node-v1.oas.controller';

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
  const { id } = req.params;
  try {
    const response = await controller.getCompanyTreeNode(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyTreeNode(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateCompanyTreeNode(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
