import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line max-len
import { ReimbursementRequestV1Controller } from './openapi/reimbursement-request-v1.oas.controller';
import { 
  QueryReimbursementRequestDto, 
  SearchReimbursementRequestDto 
} from '../domain/dto/reimbursement-request.dto';

const controller = new ReimbursementRequestV1Controller();

export async function addNewReimbursementRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addReimbursementRequest(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getReimbursementRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getReimbursementRequests(
      req.query as unknown as QueryReimbursementRequestDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getReimbursementRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getReimbursementRequest(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateReimbursementRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateReimbursementRequest(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function addResponse(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.addResponse(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function postUpdate(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.postUpdate(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function completeRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.completeReimbursementRequest(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchReimbursementRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.searchReimbursementRequest(
      req.query as unknown as SearchReimbursementRequestDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteReimbursementRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    await controller.deleteReimbursementRequest(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
