import { NextFunction, Request, Response } from 'express';
import { CompanyDocumentTypeV1Controller } from './openapi/company-document-type-v1.oas.controller';
import { 
  QueryCompanyDocumentTypeDto, 
  SearchCompanyDocumentTypeDto 
} from '../domain/dto/company-document-type.dto';

const controller = new CompanyDocumentTypeV1Controller();

export async function addCompanyDocumentType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addCompanyDocumentType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyDocumentTypes(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getCompanyDocumentTypes(
      req.query as unknown as QueryCompanyDocumentTypeDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyDocumentType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getCompanyDocumentType(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyDocumentType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateCompanyDocumentType(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchCompanyDocumentTypes(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchCompanyDocumentTypes(
      req.query as unknown as SearchCompanyDocumentTypeDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompanyDocumentType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteCompanyDocumentType(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
