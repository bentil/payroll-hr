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
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import * as service from '../../services/announcement.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';
import {
  CreateAnnouncementDto,
  QueryAnnouncementDto,
  UpdateAnnouncementDto,
  SearchAnnouncementDto,
  AnnouncementDto,
  UpdateAnnouncementResourceDto,
  AnnouncementResourceDto
} from '../../domain/dto/announcement.dto';
import { Announcement } from '@prisma/client';

@Tags('announcements')
@Route('/api/v1/announcements')
@Security('api_key')
export class AnnouncementV1Controller {
  private readonly logger = rootLogger.child({ context: AnnouncementV1Controller.name });

  /**
   * Create an Announcement
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addAnnouncement(
    @Body() createData: CreateAnnouncementDto
  ): Promise<ApiSuccessResponse<Announcement>> {
    this.logger.debug('Received request to add Announcement', { data: createData, });
    const announcement = await service.addAnnouncement(createData);
    return { data: announcement };
  }

  /**
   * Get a list of Announcement(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
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
   * Get a list of Announcement(S) for specific employee matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching Announcement(s) for employee
   */
  @Get('/me')
  public async getMyAnnouncements(
    @Queries() query: QueryAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.debug('Received request to get Announcement(s) matching query', { query });
    const { data, pagination } = await service.getAnnouncements(query, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a Announcement by ID
   * @param id Announcement ID
   * @returns an Announcement
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
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
   * Change some details of an existing Announcement
   * @param id Announcement ID
   * @param body Request body with details to update
   * @returns Updated Announcement
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
   * Change some details of an existing AnnouncementResource
   * @param id Announcement ID
   * @param announcementResourceId AnnouncementResource ID
   * @param body Request body with details to update
   * @returns Updated Announcement
   */
  @Patch('{id}/resources/{resourceId}')
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
  public async updateAnnouncementResource(
    @Path('id') id: number,
    @Path('resourceId') resourceId: number,
    @Body() updateDto: UpdateAnnouncementResourceDto,

  ): Promise<ApiSuccessResponse<AnnouncementResourceDto>> {
    this.logger.debug('Received request to update AnnouncementResource[%s]', resourceId);
    const updatedAnnouncementResource =
      await service.updateAnnouncementResource(id, resourceId, updateDto);
    this.logger.info('AnnouncementResource[%s] updated successfully!', resourceId);
    return { data: updatedAnnouncementResource };
  }

  /**
   * Search Announcement(s) by title and body
   * 
   * @param searchParam search parameters including name and description
   * @returns Announcement(s) that match search
   */
  @Get('search')
  public async searchAnnouncements(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.debug(
      'Received request to get Announcement(s) matching search query', { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncements(searchParam, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Search Announcement(s) for specific employee by title and body 
   * 
   * @param searchParam search parameters including name and description
   * @returns Announcement(s) that match search for the employee
   */
  @Get('me/search')
  public async searchMyAnnouncements(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<AnnouncementDto[]>> {
    this.logger.info(
      'Received request to get Announcement(s) matching search query', { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncements(searchParam, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing Announcement
   * @param id Announcement ID
   * @returns nothing
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

}
