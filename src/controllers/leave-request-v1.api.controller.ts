import { NextFunction, Request, Response } from 'express';
import { LeaveRequestV1Controller } from './openapi/leave-request-v1.oas.controller';
import { QueryLeaveRequestDto } from '../domain/dto/leave-request.dto';

const controller = new LeaveRequestV1Controller();

export async function addNewLeaveRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addLeaveRequest(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeaveRequests(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getLeaveRequests(
      req.query as unknown as QueryLeaveRequestDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getLeaveRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getLeaveRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateLeaveRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateLeaveRequest(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteLeaveRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteLeaveRequest(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addLeaveResponse(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.addLeaveResponse(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function cancelLeaveRequest(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.cancelLeaveRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function adjustDays(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.adjustDays(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}