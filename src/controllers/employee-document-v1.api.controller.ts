import { NextFunction, Request, Response } from 'express';

import { EmployeeDocumentV1Controller } from './openapi/employee-document-v1.oas.controller';
import { QueryEmployeeDocumentDto } from '../domain/dto/employee-document.dto';

const controller = new EmployeeDocumentV1Controller();

export async function addEmployeeDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addEmployeeDocument(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getEmployeeDocuments(
      req.query as unknown as QueryEmployeeDocumentDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeDocument(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getEmployeeDocument(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeDocument(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateEmployeeDocument(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployeeDocument( req: Request, res: Response, next: NextFunction ) {
  const { id } = req.params;
  try {
    await controller.deleteEmployeeDocument(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
