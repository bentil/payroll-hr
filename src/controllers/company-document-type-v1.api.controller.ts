import { NextFunction, Request, Response } from 'express';

import { CompanyDocumentTypeV1Controller } from './openapi/company-document-data-v1.oas.controller';
import { 
  QueryCompanyDocumentTypeDto, 
  SearchCompanyDocumentTypeDto 
} from '../domain/dto/company-document-type.dto';

const controller = new CompanyDocumentTypeV1Controller();

export async function addCompanyDocumentType(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addCompanyDocumentType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyDocumentTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getCompanyDocumentTypes(
      req.query as unknown as QueryCompanyDocumentTypeDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyDocumentType(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getCompanyDocumentType(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyDocumentType(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateCompanyDocumentType(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchCompanyDocumentTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.searchCompanyDocumentType(
      req.query as unknown as SearchCompanyDocumentTypeDto
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompanyDocumentType( req: Request, res: Response, next: NextFunction ) {
  const { id } = req.params;
  try {
    await controller.deleteCompanyDocumentType(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
