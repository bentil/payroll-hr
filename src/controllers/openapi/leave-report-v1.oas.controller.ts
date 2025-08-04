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
  LeaveBalanceReportObject,
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
   * Get report on leaves taken by employees in a company
   * 
   * @param companyId 
   * @param query 
   * @param query Request query parameters, including pagination and ordering details
   * @returns Repont on leaves taken
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
   * Report on leaves taken by an employee
   * 
   * @param companyId 
   * @param employeeId 
   * @param query Request query parameters, including pagination and ordering details
   * @returns Leave taken report
   */
  @Get('/leaves-taken/employees/{employeeId}')
  public async getEmployeeLeavesTaken(
    @Path('companyId') companyId: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: QueryLeaveRequestForReportDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeLeaveTakenReportObject>> {
    this.logger.debug(
      'Received request to get report for LeavesTaken matching query for Employee[%s]', 
      { query }, employeeId);
    const data = await service.getEmployeeLeavesTakenReport(
      companyId, employeeId, query, req.user!
    );
    this.logger.info('Returning report on LeavesTaken by Employee[%s]', employeeId);
    return { data };
  }

  /**
   * Get a report on LeaveBalance for employees
   *
   * @param companyId 
   * @returns Report of leaveBalance for individual leavePackages for employees
   */
  @Get('/leaves-balance')
  public async getLeavesBalance(
    @Path('companyId') companyId: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveBalanceReportObject[]>> {
    this.logger.debug(
      'Received request to get report for LeaveBalance for employees in Company[%s]', companyId
    );
    const data = await service.getLeavesBalanceReport(companyId, req.user!);
    this.logger.info('Returning report on LeaveBalance for employees in Company[%s]', companyId);
    return { data };
  }
}
