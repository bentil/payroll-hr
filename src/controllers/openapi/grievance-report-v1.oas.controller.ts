import { GrievanceReport } from '@prisma/client';
import {
  Body,
  Get,
  Patch,
  Path,
  Post,
  Queries,
  Response,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  CreateGrievanceReportDto,
  QueryGrievanceReportDto,
  SearchGrievanceReportDto,
  UpdateGrievanceReportDto,
} from '../../domain/dto/grievance-report.dto';
import * as grievanceReportService from '../../services/grievance-report.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('grievance-reports')
@Route('/api/v1/grievance-reports')
@Security('api_key')
export class GrievanceReportV1Controller {
  private readonly logger = rootLogger.child({ context: GrievanceReportV1Controller.name, });

  /**
   * Create a GrievanceReport
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addGrievanceReport(
    @Body() createData: CreateGrievanceReportDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<GrievanceReport>> {
    this.logger.debug('Received request to add GrievanceReport', { data: createData, });
    const grievanceReport = await grievanceReportService.addGrievanceReport(createData, req.user!);
    return { data: grievanceReport };
  }

  /**
   * Get a list of GrievanceReport(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching GrievanceReport(s)
   */
  @Get()
  public async getGrievanceReports(
    @Queries() query: QueryGrievanceReportDto
  ): Promise<ApiSuccessResponse<GrievanceReport[]>> {
    this.logger.debug('Received request to get GrievanceReport(s) matching query', { query });
    const { data, pagination } = await grievanceReportService.getGrievanceReports(query);
    this.logger.info('Returning %d GrievanceReport(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a GrievanceReport by ID
   * @param id GrievanceReport ID
   * @returns GrievanceReport
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'GrievanceReport does not exist',
    details: [],
  })
  public async getGrievanceReport(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<GrievanceReport>> {
    this.logger.debug('Received request to get grievanceReport[%s]', id);
    const grievanceReport = await grievanceReportService.getGrievanceReport(id);
    return { data: grievanceReport };
  }

  /**
   * Change the details of an existing GrievanceReport
   * @param id GrievanceReport ID
   * @param body Request body with details to update to
   * @returns Updated GrievanceReport
   */
  @Patch('{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: 'REQUEST_VALIDATION_FAILED',
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: 'INVALID_STATE',
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateGrievanceReport(
    @Path('id') id: number,
    @Body() updateDto: UpdateGrievanceReportDto
  ): Promise<ApiSuccessResponse<GrievanceReport>> {
    this.logger.debug('Received request to update GrievanceReport[%s]', id);
    const updateGrievanceReport = await grievanceReportService.updateGrievanceReport(id, updateDto);
    this.logger.info('GrievanceType[%s] updated successfully!', id);
    return { data: updateGrievanceReport };
  }

  /**
   * Search for GrievanceReport(s) by reportNumber and note
   * 
   * @param searchParam search parameters including reportNumber and note
   * @returns GrievanceReport(s) that match search
   */
  @Get('search')
  public async searchGrievanceReports(
    @Queries() searchParam: SearchGrievanceReportDto,  @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<GrievanceReport[]>> {
    this.logger.debug(
      'Received request to get GrievanceReport(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await grievanceReportService.searchGrievanceReports(searchParam, req.user!);
    this.logger.info('Returning %d GrievanceReport(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing GrievanceReport
   * @param id GrievanceReport ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.GRIEVANCE_REPORT_NOT_FOUND,
    message: 'GrievanceType does not exist',
    details: [],
  })
  public async deleteGrievanceReport(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete GrievanceReport[%s]', id);
    await grievanceReportService.deleteGrievanceReport(id);
    this.logger.debug('GrievanceReport[%s] deleted successfully', id);
  }

}
