import { NextFunction, Request, Response } from 'express';
import { LeaveTypeV1Controller } from './openapi/leave-type.v1.oas.controller';
import { 
  QueryApplicableLeaveTypeDto, 
  QueryLeaveTypeDto, 
  SearchLeaveTypeDto 
} from '../domain/dto/leave-type.dto';

const controller = new LeaveTypeV1Controller();

export async function addLeaveType(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addLeaveType(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateLeaveType(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateLeaveType(Number(id), req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listLeaveTypes(req: Request, res: Response, next: NextFunction) {
  const { query } = req;
  try {
    const response = await controller.getLeaveTypes(
      query as unknown as QueryLeaveTypeDto);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function listApplicableLeaveTypes(req: Request, res: Response, next: NextFunction) {
  const { query } = req;
  try {
    const response = await controller.getApplicableLeaveTypes(
      query as unknown as QueryApplicableLeaveTypeDto);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchLeaveTypes(req: Request, res: Response, next: NextFunction) {
  const { query } = req;
  try {
    const response = await controller.searchLeaveType(query as unknown as SearchLeaveTypeDto,);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeaveTypeById(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getLeaveTypeById(Number(id));
    res.json(response);
  } catch (err) {
    return next(err);
  }
}

export async function deleteLeaveType(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.deleteLeaveType(Number(id));
    res.status(204).json(response);
  } catch (err) {
    return next(err);
  }
}
