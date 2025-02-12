import { NextFunction, Request, Response } from 'express';
import { LeavePlanV1Controller } from './openapi/leave-plan-v1.oas.controller';
import { QueryLeavePlanDto } from '../domain/dto/leave-plan.dto';

const controller = new LeavePlanV1Controller();

export async function addNewLeavePlan(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addLeavePlan(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavePlans(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getLeavePlans(
      req.query as unknown as QueryLeavePlanDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeavePlan(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getLeavePlan(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateLeavePlan(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateLeavePlan(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteLeavePlan(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteLeavePlan(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
