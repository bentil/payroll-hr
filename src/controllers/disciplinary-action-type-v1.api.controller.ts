import { NextFunction, Request, Response } from 'express';

import { 
  DisciplinaryActionTypeV1Controller 
} from './openapi/disciplinary-action-type-v1.oas.controller';
import { 
  QueryDisciplinaryActionTypeDto, 
  SearchDisciplinaryActionTypeDto 
} from '../domain/dto/disciplinary-action-type.dto';

const controller = new DisciplinaryActionTypeV1Controller();

export async function addNewDisciplinaryActionType(
  req: Request, res: Response, next: NextFunction
) {
  try {
    const response = await controller.addDisciplinaryActionType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplinaryActionTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getDisciplinaryActionTypes(
      req.query as unknown as QueryDisciplinaryActionTypeDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplinaryActionType(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getDisciplinaryActionType(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}
export async function updateDisciplinaryActionType(
  req: Request, res: Response, next: NextFunction
) {
  const { id } = req.params;
  try {
    const response = await controller.updateDisciplinaryActionType(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchDisciplinaryActionType(
  req: Request, res: Response, next: NextFunction
) {
  try {
    const response = await controller.searchDisciplinaryActionType(
      req.query as unknown as SearchDisciplinaryActionTypeDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}


export async function deleteDisciplinaryActionType(
  req: Request, res: Response, next: NextFunction
) {
  const { id } = req.params;
  try {
    await controller.deleteDisciplinaryActionType(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
