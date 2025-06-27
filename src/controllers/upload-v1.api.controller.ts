import { Request, Response, NextFunction } from 'express';
import { UploadV1Controller } from './openapi/upload-v1.oas.controller';
import { FilterLeaveRequestForExportDto } from '../domain/dto/leave-request.dto';

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

export async function exportLeaveRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;  
    const response = await controller.exportLeaveRequests(
      +companyId, req.query as unknown as FilterLeaveRequestForExportDto, req
    );
    res.setHeader(
      'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="leave-requests.xlsx"');
    await response.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}