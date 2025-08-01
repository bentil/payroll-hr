import {
  Get,
  Path,
  Queries,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { ApiSuccessResponse } from '../../domain/api-responses';
import {
  EmployeeLeaveTakenReportObject,
  LeaveTakenReportObject,
  QueryLeaveRequestForReportDto,
} from '../../domain/dto/leave-request.dto';
import * as service from '../../services/leave-request.service';
import { rootLogger } from '../../utils/logger';

@Tags('leave-reports')
@Route('/api/v1/payroll-companies/{companyId}/leave-requests/reports')
@Security('api_key')
export class LeaveReportV1Controller {
  private readonly logger = rootLogger.child({ context: LeaveReportV1Controller.name, });

  /**
   * Get a list of LeaveRequest(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching LeaveRequest(s)
   */
  @Get('/leaves-taken')
  public async getLeavesTaken(
    @Path('companyId') companyId: number,
    @Queries() query: QueryLeaveRequestForReportDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveTakenReportObject[]>> {
    this.logger.debug('Received request to get report for LeavesTaken matching query', { query });
    const data = await service.getLeavesTakenReport(companyId, query, req.user!);
    this.logger.info('Returning report on LeavesTaken');
    return { data };
  }

  /**
   * Get a list of LeaveRequest(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching LeaveRequest(s)
   */
  @Get('/leaves-taken/employees/{employeeId}')
  public async getEmployeeLeavesTaken(
    @Path('companyId') companyId: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: QueryLeaveRequestForReportDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeLeaveTakenReportObject[]>> {
    this.logger.debug(
      'Received request to get report for LeavesTaken matching query for Employee[%s]', 
      { query }, employeeId);
    const data = await service.getEmployeeLeavesTakenReport(
      companyId, employeeId, query, req.user!
    );
    this.logger.info('Returning report on LeavesTaken by Employee[%s]', employeeId);
    return { data };
  }
}
