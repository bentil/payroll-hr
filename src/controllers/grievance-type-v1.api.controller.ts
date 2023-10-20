import { NextFunction, Request, Response } from 'express';

import { GrievanceTypeV1Controller } from './openapi/grievance-type-v1.oas.controller';
import { QueryGrievanceTypeDto, SearchGrievanceTypeDto } from '../domain/dto/grievance-type.dto';

const controller = new GrievanceTypeV1Controller();

export const addNewGrievanceType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.addGrievanceType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const getGrievanceTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.getGrievanceTypes(
      req.query as unknown as QueryGrievanceTypeDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getGrievanceType = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const response = await controller.getGrievanceType(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
export const updateGrievanceType = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const response = await controller.updateGrievanceType(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const searchGrievanceTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await controller.searchGrievanceType(
      req.query as unknown as SearchGrievanceTypeDto
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
};


export const deleteGrievanceType = async ( req: Request, res: Response, next: NextFunction ) => {
  const { id } = req.params;
  try {
    await controller.deleteGrievanceType(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
