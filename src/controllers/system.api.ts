import { NextFunction, Request, Response } from 'express';
import { SystemController } from './openapi/system.oas.controller';

const controller = new SystemController();

export async function serveLeaveRequestTemplate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>  {
  try {
    const response = await controller.serveLeaveRequestTemplate();
    res.download(response);
  } catch (err) {
    next(err);
  }
}