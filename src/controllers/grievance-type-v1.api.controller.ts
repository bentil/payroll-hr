import { NextFunction, Request, Response } from 'express';
import { GrievanceTypeV1Controller } from './openapi/grievance-type-v1.oas.controller';
import { QueryGrievanceTypeDto, SearchGrievanceTypeDto } from '../domain/dto/grievance-type.dto';

const controller = new GrievanceTypeV1Controller();

export async function addNewGrievanceType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addGrievanceType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceTypes(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getGrievanceTypes(
      req.query as unknown as QueryGrievanceTypeDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getGrievanceType(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateGrievanceType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateGrievanceType(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchGrievanceTypes(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchGrievanceTypes(
      req.query as unknown as SearchGrievanceTypeDto
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteGrievanceType(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteGrievanceType(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
