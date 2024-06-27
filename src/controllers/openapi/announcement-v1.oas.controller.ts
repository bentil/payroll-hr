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
  CreateAnnouncementDto,
  QueryAnnouncementDto,
  UpdateAnnouncementDto,
  SearchAnnouncementDto,
} from '../../domain/dto/announcement.dto';
import * as service from '../../services/announcement.service';
import * as announcementResourceService from '../../services/announcement-resource.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';
import { UpdateAnnouncementResourceDto } from '../../domain/dto/announcement-resource.dto';
import { Announcement, AnnouncementResource } from '@prisma/client';

@Tags('announcements')
@Route('/api/v1/announcements')
@Security('api_key')
export class AnnouncementV1Controller {
  private readonly logger = rootLogger.child({ context: AnnouncementV1Controller.name, });

  /**
   * Create a announcement
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
   * Get a list of announcement matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching Announcement
   */
  @Get()
  public async getAnnouncements(
    @Queries() query: QueryAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<Announcement[]>> {
    this.logger.debug('Received request to get Announcement(s) matching query', { query });
    const { data, pagination } = await service.getAnnouncements(query, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a list of announcement for specific employee matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching Announcement for employee
   */
  @Get('/me')
  public async getMyAnnouncements(
    @Queries() query: QueryAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<Announcement[]>> {
    this.logger.debug('Received request to get Announcement(s) matching query', { query });
    const { data, pagination } = await service.getAnnouncements(query, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a announcement by ID
   * @param id announcement ID
   * @returns announcement
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
  ): Promise<ApiSuccessResponse<Announcement>> {
    this.logger.debug('Received request to get Announcement[%s]', id);
    const announcement = await service.getAnnouncement(id, req.user!);
    return { data: announcement };
  }

  /**
   * Change the details of an existing announcement
   * @param id announcement ID
   * @param body Request body with announcement to update to
   * @returns Updated announcement
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
    @Body() updateDto: UpdateAnnouncementDto
  ): Promise<ApiSuccessResponse<Announcement>> {
    this.logger.debug('Received request to update Announcement[%s]', id);
    const updatedAnnouncement = await service.updateAnnouncement(id, updateDto);
    this.logger.info('Announcement[%s] updated successfully!', id);
    return { data: updatedAnnouncement };
  }

  /**
   * Change the details of an existing announcementResource
   * @param id announcement ID
   * @param announcementResourceId announcementResource ID
   * @param body Request body with announcement to update to
   * @returns Updated announcement
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
    @Body() updateDto: UpdateAnnouncementResourceDto
  ): Promise<ApiSuccessResponse<AnnouncementResource>> {
    this.logger.debug('Received request to update AnnouncementResource[%s]', resourceId);
    const updatedAnnouncementResource =
      await announcementResourceService.updateAnnouncementResource(id, resourceId, updateDto);
    this.logger.info('AnnouncementResource[%s] updated successfully!', resourceId);
    return { data: updatedAnnouncementResource };
  }

  /**
   * Search a announcement by name and description
   * 
   * @param searchParam search parameters including name and description
   * @returns announcement that match search
   */
  @Get('search')
  public async searchAnnouncement(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<Announcement[]>> {
    this.logger.info(
      'Received request to get Announcement(s) matching search query', { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncement(searchParam, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Search a announcement for specific employee by title and body 
   * 
   * @param searchParam search parameters including name and description
   * @returns announcement that match search for the employee
   */
  @Get('me/search')
  public async searchMyAnnouncement(
    @Queries() searchParam: SearchAnnouncementDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<Announcement[]>> {
    this.logger.info(
      'Received request to get Announcement(s) matching search query', { searchParam }
    );
    const { data, pagination } =
      await service.searchAnnouncement(searchParam, req.user!);
    this.logger.info('Returning %d Announcement(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing announcement
   * @param id announcement ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.ANNOUNCE_NOT_FOUND,
    message: 'Announcement does not exist',
    details: [],
  })
  public async deleteAnnouncement(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete Announcement[%s]', id);
    await service.deleteAnnouncement(id);
    this.logger.debug('Announcement[%s] deleted successfully', id);
  }

}
