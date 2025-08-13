import { Announcement, AnnouncementReadEvent } from '@prisma/client';
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
  Delete,
} from 'tsoa';
import {
  ApiErrorResponse,
  ApiSuccessResponse
} from '../../domain/api-responses';
import {
  CreateAnnouncementDto,
  QueryAnnouncementDto,
  UpdateAnnouncementDto,
  SearchAnnouncementDto,
  AnnouncementDto,
  UpdateAnnouncementResourceDto,
  AnnouncementResourceDto,
  QueryEmployeeAnnouncementDto
} from '../../domain/dto/announcement.dto';
import * as service from '../../services/announcement.service';
import * as readEventService from '../../services/announcement-read-event.service';
import PdfGenerationService from '../../services/PdfGenerationService';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';
import { 
  //AnnouncementReadEventDto, 
  AnnouncementReadEventResponseDto, 
  CreateAnnouncementReadEventDto, 
  QueryAnnouncementReadEventSummaryDto,
  ReadEventSummmaryDto
} from '../../domain/dto/announcement-read-event.dto';


@Tags('announcements')
@Route('/api/v1/announcements')
@Security('api_key')
export class AnnouncementV1Controller {
  private readonly logger = rootLogger.child({
    context: AnnouncementV1Controller.name
  });

  /**
   * Create an Announcement
   * 
   * @param createData Request body
   * @param req Request object
   * @returns Announcement
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addAnnouncement(
    @Body() createData: CreateAnnouncementDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<Announcement>> {
    this.logger.debug('Received request to add Announcement', { data: createData, });
    const announcement = await service.addAnnouncement(createData, req.user!);
    return { data: announcement };
  }

  /**
   * Get a list of Announcement(s) matching query
   * 
   * @param query Request query parameters, including pagination and ordering details
   * @param req Request object
   * @returns List of matching Announcement(s)
   */
  @Get()
  public async getAnnouncements(
    @Queries() query: QueryAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.debug('Received request to get Announcement(s) matching query', { query });
    const { data, pagination } = await service.getAnnouncements(query, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched the query', data.length);
    return { data, pagination };
  }
  
  /**
   * Get a list of Announcement(s) for an employee
   * 
   * @param query Request query parameters, including pagination and ordering details
   * @param req Request object
   * @returns List of matching Announcement(s)
   */
  @Get('/me')
  public async getMyAnnouncements(
    @Queries() query: QueryEmployeeAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.debug('Received request to get Announcement(s) matching query', { query });
    const { data, pagination } = await service.getAnnouncements(query, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get an Announcement
   * 
   * @param id Announcement id
   * @param req Request object
   * @returns Announcement
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Announcement does not exist',
    details: [],
  })
  public async getAnnouncement(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto>> {
    this.logger.debug('Received request to get Announcement[%s]', id);
    const announcement = await service.getAnnouncement(id, req.user!);
    return { data: announcement };
  }
  
  /**
   * Update an Announcement
   * 
   * @param id Announcement id
   * @param updateDto Request body with details to update
   * @param req Request object
   * @returns Updated Announcement
   */
  @Patch('{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: errors.REQUEST_VALIDATION_FAILED,
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: errors.INVALID_STATE,
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateAnnouncement(
    @Path('id') id: number,
    @Body() updateDto: UpdateAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto>> {
    this.logger.debug('Received request to update Announcement[%s]', id);
    const updatedAnnouncement = await service.updateAnnouncement(id, updateDto, req.user!);
    this.logger.info('Announcement[%s] updated successfully!', id);
    return { data: updatedAnnouncement };
  }

  /**
   * Update an AnnouncementResource
   * 
   * @param announcementId Announcement id
   * @param id Resource id
   * @param updateDto Request body with details to update
   * @param req Request object
   * @returns Updated Announcement
   */
  @Patch('{announcementId}/resources/{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: errors.REQUEST_VALIDATION_FAILED,
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: errors.INVALID_STATE,
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateAnnouncementResource(
    @Path('announcementId') announcementId: number,
    @Path('id') id: number,
    @Body() updateDto: UpdateAnnouncementResourceDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<AnnouncementResourceDto>> {
    this.logger.debug('Received request to update AnnouncementResource[%s]', id);
    const updatedAnnouncementResource = await service
      .updateAnnouncementResource(announcementId, id, updateDto, req.user!);
    this.logger.info('AnnouncementResource[%s] updated successfully!', id);
    return { data: updatedAnnouncementResource };
  }
  
  /**
   * Search Announcement(s) by title and body
   * 
   * @param searchParam Search keywords
   * @param req Request object
   * @returns List of matching Announcement(s)
   */
  @Get('search')
  public async searchAnnouncements(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.debug(
      'Received request to get Announcement(s) matching search query',
      { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncements(searchParam, req.user!);
    this.logger.info(
      'Returning %d Announcement(s) that matched search query', data.length
    );
    return { data, pagination };
  }
  
  /**
   * Search Announcement(s) for employee by title and body
   * 
   * @param searchParam Search keyword(s)
   * @param req Request object
   * @returns List of matching Announcement(s)
   */
  @Get('me/search')
  public async searchMyAnnouncements(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.info(
      'Received request to get Announcement(s) matching search query',
      { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncements(searchParam, req.user!);
    this.logger.info(
      'Returning %d Announcement(s) that matched search query', data.length
    );
    return { data, pagination };
  }
  
  /**
   * Remove an Announcement
   * 
   * @param id Announcement id
   * @param req Request body
   */
  @Delete('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.ANNOUNCEMENT_NOT_FOUND,
    message: 'Announcement does not exist',
    details: [],
  })
  @SuccessResponse(204)
  public async deleteAnnouncement(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<void> {
    this.logger.debug('Received request to delete Announcement[%s]', id);
    await service.deleteAnnouncement(id, req.user!);
    this.logger.debug('Announcement[%s] deleted successfully', id);
  }

  /**
   * Create an AnnouncementReadEvent
   * 
   * @param createData Request body
   * @param req Request object
   * @returns AnnouncementReadEvent
   */
  @Post('{id}/read-events')
  @SuccessResponse(201, 'Created')
  public async addAnnouncementReadEvent(
    @Path('id') id: number,
    @Body() createData: CreateAnnouncementReadEventDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<AnnouncementReadEvent>> {
    this.logger.debug('Received request to add Announcement', { data: createData, });
    const announcement = await readEventService.addAnnouncementReadEvent(id, createData, req.user!);
    return { data: announcement };
  }

  /**
   * Get a list of AnnouncementReadEventSummary for a company
   * 
   * @param query Request query parameters, including pagination and ordering details
   * @param req Request object
   * @returns List of AnnouncementReadEvent for company
   */
  @Get('/read-events/summary')
  public async getAnnouncementReadEventSummaryList(
    @Queries() query: QueryAnnouncementReadEventSummaryDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementReadEventResponseDto[]>> {
    this.logger.debug('Received request to get list of AnnouncementReadEventSummary');
    const summary = await readEventService.getAnnouncementReadEventSummaryList(
      query, req.user!
    );
    this.logger.info('Returning list ofAnnouncementReadEventSummary');
    return { data: summary };
  }

  /**
   * Get an AnnouncementReadEventSummary
   * 
   * @param id Announcement id
   * @param req Request object
   * @returns Announcement
   */
  @Get('/{id}/read-events/summary')
  public async getAnnouncementReadEventSummary(
    @Path('id') id: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<AnnouncementReadEventResponseDto>> {
    this.logger.debug(
      'Received request to get AnnouncementReadEventSummary for Announcement[%s]', id
    );
    const announcement = await readEventService.getAnnouncementReadEventSummary(id, req.user!);
    return { data: announcement };
  }

  /**
   * Get an AnnouncementReadEventDetails
   * 
   * @param id Announcement id
   * @param req Request object
   * @returns Announcement
   */
  @Get('/{id}/read-events/details')
  public async getReadEventDetails(
    @Path('id') id: number,
  ): Promise<ApiSuccessResponse<ReadEventSummmaryDto[]>> {
    this.logger.debug(
      'Received request to get AnnouncementReadEventDetails for Announcement[%s]', id
    );
    const details = await readEventService.getReadEventDetails(id);
    return { data: details };
  }

  /**
   * Generate PDF report of AnnouncementReadEvent details
   * 
   * @param id Announcement id
   * @param req Request object
   * @returns PDF report URL
   */
  @Get('/{id}/read-events/details/pdf')
  public async getReadEventDetailsPdf(
    @Path('id') id: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<{}>> {
    this.logger.debug(
      'Received request to generate PDF for AnnouncementReadEvent for Announcement[%s]', id
    );
    
    const announcement = await service.getAnnouncement(id, req.user!);
    const details = await readEventService.getReadEventDetails(id);
    
    const employeeData = details.map(detail => ({
      name: detail.employee.fullName,
      jobTitle: detail.employee.jobTitle?.name || 'N/A',
      department: detail.employee.department?.name || 'N/A'
    }));

    const pdfResult = await PdfGenerationService.generateAnnouncementReadEventsPdf({
      announcementTitle: announcement.title,
      publishDate: announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Not published',
      companyName: announcement.company?.name || 'N/A',
      employees: employeeData
    });

    this.logger.info('PDF report generated for Announcement[%s]', id);
    return { data: pdfResult.presignedUrl };
  }
}
