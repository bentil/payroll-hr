import { Request, Response, NextFunction } from 'express';
import { UploadV1Controller } from './openapi/upload-v1.oas.controller';
import { ExportLeaveRequestQueryDto } from '../domain/dto/leave-request.dto';
import { ExportDisciplinaryActionQueryDto } from '../domain/dto/disciplinary-action.dto';
import { ExportGrievanceReportQueryDto } from '../domain/dto/grievance-report.dto';

const controller = new UploadV1Controller();
export async function uploadLeaveRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const file = req.file as Express.Multer.File;
    const response = await controller.uploadLeaveRequests(+companyId, file, req);
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
      +companyId, req.query as unknown as ExportLeaveRequestQueryDto, req
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


export async function exportDisciplinaryActions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;  
    const response = await controller.exportDisciplinaryActions(
      +companyId, req.query as unknown as ExportDisciplinaryActionQueryDto, req
    );
    res.setHeader(
      'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="disciplinary-actions.xlsx"');
    await response.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}


export async function exportGrievanceReports(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;  
    const response = await controller.exportGrievanceReports(
      +companyId, req.query as unknown as ExportGrievanceReportQueryDto
    );
    res.setHeader(
      'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="grievance-reports.xlsx"');
    await response.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}