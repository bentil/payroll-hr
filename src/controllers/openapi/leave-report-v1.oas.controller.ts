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
import * as payrollCompanyService from '../../services/payroll-company.service';
import PdfGenerationService from '../../services/PdfGenerationService';
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

  /**
   * Generate PDF report of leaves taken by employees in a company
   * 
   * @param companyId 
   * @param query 
   * @param req Request object
   * @returns PDF report URL
   */
  @Get('/leaves-taken/pdf')
  public async getLeavesTakenPdf(
    @Path('companyId') companyId: number,
    @Queries() query: QueryLeaveRequestForReportDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<{ presignedUrl: string; s3Key: string; bucket: string }>> {
    this.logger.debug(
      'Received request to generate PDF for LeavesTaken report for Company[%s]', companyId
    );
    
    const reportData = await service.getLeavesTakenReport(companyId, query, req.user!);
    
    // Get company information
    const company = await payrollCompanyService.getPayrollCompany(companyId);
    const companyName = company.name;

    // Format report period from query parameters
    let reportPeriod = 'All Time';
    if (query['startDate.gte'] || query['startDate.lte']) {
      const startDate = query['startDate.gte'] ? new Date(query['startDate.gte']).toLocaleDateString() : 'Beginning';
      const endDate = query['startDate.lte'] ? new Date(query['startDate.lte']).toLocaleDateString() : 'Present';
      reportPeriod = `${startDate} - ${endDate}`;
    }

    const pdfResult = await PdfGenerationService.generateLeavesTakenReportPdf({
      companyName,
      reportPeriod,
      reportData
    });

    this.logger.info('PDF report generated for leaves taken in Company[%s]', companyId);
    return { data: pdfResult };
  }

  /**
   * Generate PDF report of leaves taken by a specific employee
   * 
   * @param companyId 
   * @param employeeId 
   * @param query 
   * @param req Request object
   * @returns PDF report URL
   */
  @Get('/leaves-taken/employees/{employeeId}/pdf')
  public async getEmployeeLeavesTakenPdf(
    @Path('companyId') companyId: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: QueryLeaveRequestForReportDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<{ presignedUrl: string; s3Key: string; bucket: string }>> {
    this.logger.debug(
      'Received request to generate PDF for employee leaves taken report for Employee[%s] in Company[%s]', 
      employeeId, companyId
    );
    
    const reportData = await service.getEmployeeLeavesTakenReport(companyId, employeeId, query, req.user!);
    
    // Get company information
    const company = await payrollCompanyService.getPayrollCompany(companyId);
    const companyName = company.name;

    // Format report period from query parameters
    let reportPeriod = 'All Time';
    if (query['startDate.gte'] || query['startDate.lte']) {
      const startDate = query['startDate.gte'] ? new Date(query['startDate.gte']).toLocaleDateString() : 'Beginning';
      const endDate = query['startDate.lte'] ? new Date(query['startDate.lte']).toLocaleDateString() : 'Present';
      reportPeriod = `${startDate} - ${endDate}`;
    }

    const pdfResult = await PdfGenerationService.generateEmployeeLeaveTakenReportPdf({
      employeeName: reportData.employee.name,
      employeeNumber: reportData.employee.employeeNumber,
      companyName,
      reportPeriod,
      leaveTypes: reportData.leaveType
    });

    this.logger.info('PDF report generated for employee leaves taken for Employee[%s]', employeeId);
    return { data: pdfResult };
  }

  /**
   * Generate PDF report of leave balances for all employees in a company
   * 
   * @param companyId 
   * @param req Request object
   * @returns PDF report URL
   */
  @Get('/leaves-balance/pdf')
  public async getLeavesBalancePdf(
    @Path('companyId') companyId: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<{ presignedUrl: string; s3Key: string; bucket: string }>> {
    this.logger.debug(
      'Received request to generate PDF for leave balance report for Company[%s]', companyId
    );
    
    const reportData = await service.getLeavesBalanceReport(companyId, req.user!);
    
    // Get company information
    const company = await payrollCompanyService.getPayrollCompany(companyId);
    const companyName = company.name;

    // Set report period as current date since this is a balance report
    const reportPeriod = `As of ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

    const pdfResult = await PdfGenerationService.generateLeaveBalanceReportPdf({
      companyName,
      reportPeriod,
      employees: reportData
    });

    this.logger.info('PDF report generated for leave balances in Company[%s]', companyId);
    return { data: pdfResult };
  }
}
