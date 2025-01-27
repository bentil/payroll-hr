import { NextFunction, Request, Response } from 'express';
import { 
  DisciplinaryActionV1Controller 
} from './openapi/disciplinary-action-v1.oas.controller';
import { 
  QueryDisciplinaryActionDto, 
  SearchDisciplinaryActionDto 
} from '../domain/dto/disciplinary-action.dto';

const controller = new DisciplinaryActionV1Controller();

export async function addNewDisciplinaryAction(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addDisciplinaryAction(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplinaryActions(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getDisciplinaryActions(
      req.query as unknown as QueryDisciplinaryActionDto,
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplinaryAction(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getDisciplinaryAction(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateDisciplinaryAction(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateDisciplinaryAction(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchDisciplinaryAction(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchDisciplinaryActions(
      req.query as unknown as SearchDisciplinaryActionDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}


export async function deleteDisciplinaryAction(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteDisciplinaryAction(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
