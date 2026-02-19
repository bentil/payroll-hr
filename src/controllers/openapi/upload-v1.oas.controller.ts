import { 
  Get,
  Path, 
  Post,
  Route, 
  Request,
  Security, 
  Tags, 
  UploadedFile, 
  Queries
} from 'tsoa';
import { rootLogger } from '../../utils/logger';
import * as leaveReqeustService from '../../services/leave-request.service';
import { 
  ExportLeaveRequestQueryDto,
  UploadLeaveRequestResponse 
} from '../../domain/dto/leave-request.dto';
import { ExportDisciplinaryActionQueryDto } from '../../domain/dto/disciplinary-action.dto';
import { exportDisciplinaryActions } from '../../services/disciplinary-action.service';
import { ExportGrievanceReportQueryDto } from '../../domain/dto/grievance-report.dto';
import { exportGrievanceReports } from '../../services/grievance-report.service';
import { UploadEmployeeWorkTimeResponse } from '../../domain/dto/employee-work-time.dto';
import { uploadEmployeeWorkTimes } from '../../services/employee-work-time.service';

@Tags('upload')
@Route('/api/v1/payroll-companies/{companyId}')
@Security('api_key')
export class UploadV1Controller {
  private readonly logger = rootLogger.child({ context: UploadV1Controller.name });
  /**
     * Add new leaveRequests by uploading via template excel file
     *
     * @param companyId Company id
     * @param file File containing employee data
     * @param req Request object
     * @returns Employee
     */
    @Post('/uploads/leave-requests')
  public async uploadLeaveRequests(
    @Path('companyId') companyId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: Express.Request
  ): Promise<UploadLeaveRequestResponse> {
    this.logger.debug('About to upload LeaveRequests for the company[%s]', companyId);
    return await leaveReqeustService.uploadLeaveRequests(companyId, file, req.user!);
  }

  /**
   * Get leave requests for a payroll company and export them as an Excel file.
   * 
   * @param companyId 
   * @param query 
   * @param req 
   * @returns excel file stream
   */
  @Get('/exports/leave-requests')
    public async exportLeaveRequests(
      @Path('companyId') companyId: number,
      @Queries() query: ExportLeaveRequestQueryDto,
      @Request() req: Express.Request,
    ): Promise<any> {
      this.logger.debug('Received request to export LeaveRequest');
      const rel = await leaveReqeustService.exportLeaveRequests(companyId, query, req.user!);
      return rel;
    }

  /**
   * Get disciplinary actions for a payroll company and export them as an Excel file.
   * 
   * @param companyId 
   * @param query 
   * @param req 
   * @returns excel file stream
   */
  @Get('/exports/disciplinary-actions')
  public async exportDisciplinaryActions(
    @Path('companyId') companyId: number,
    @Queries() query: ExportDisciplinaryActionQueryDto,
    @Request() req: Express.Request,
  ): Promise<any> {
    this.logger.debug('Received request to export DisciplinaryAction');
    const rel = await exportDisciplinaryActions(companyId, query, req.user!);
    return rel;
  }

  /**
   * Get grievance reports for a payroll company and export them as an Excel file.
   * 
   * @param companyId 
   * @param query 
   * @param req 
   * @returns excel file stream
   */
  @Get('/exports/grievance-reports')
  public async exportGrievanceReports(
    @Path('companyId') companyId: number,
    @Queries() query: ExportGrievanceReportQueryDto,
  ): Promise<any> {
    this.logger.debug('Received request to export GrievanceReport');
    const rel = await exportGrievanceReports(companyId, query);
    return rel;
  }

  
  /**
   * Add new employee work times by uploading via template excel file
   *
   * @param companyId Company id
   * @param file File containing employee data
   * @param req Request object
   * @returns EmployeeWorkTimeResponse
   */
  @Post('/uploads/employee-work-times')
  public async uploadEmployeeWorkTimes(
    @Path('companyId') companyId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: Express.Request
  ): Promise<UploadEmployeeWorkTimeResponse> {
    this.logger.debug('About to upload EmployeeWorkTimes');
    return await uploadEmployeeWorkTimes(companyId, file, req.user!);
  }

}