import { Request, Response, NextFunction } from 'express';
import { UploadV1Controller } from './openapi/upload-v1.oas.controller';

const controller = new UploadV1Controller();
export async function uploadLeaveRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const file = req.file as Express.Multer.File;
    const response = await controller.uploadLeaveRequests(+companyId, file);
    res.json(response);
  } catch (err) {
    next(err);
  }
}