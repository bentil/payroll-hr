import { ReimbursementRequest } from '@prisma/client';
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
import { 
  CompleteReimbursementRequestDto,
  CreateReimbursementRequestDto, 
  QueryReimbursementRequestDto, 
  ReimbursementRequestUpdatesDto, 
  ReimbursementResponseInputDto, 
  SearchReimbursementRequestDto, 
  UpdateReimbursementRequestDto
} from '../../domain/dto/reimbursement-request.dto';
import * as reimbursementReqService from '../../services/reimbursement-request.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('reimbursement-requests')
@Route('/api/v1/reimbursement-requests')
@Security('api_key')
export class ReimbursementRequestV1Controller {
  private readonly logger = rootLogger.child({ context: ReimbursementRequestV1Controller.name, });

  /**
   * Create a reimbursement request
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addReimbursementRequest(
    @Body() createData: CreateReimbursementRequestDto, 
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to add ReimbursementRequest', { data: createData, });
    const reimbursementRequest = await reimbursementReqService.addReimbursementRequest(createData);
    return { data: reimbursementRequest };
  }

  /**
   * Get a list of reimbursement request matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching reimbursement request
   */
  @Get()
  public async getReimbursementRequests(
    @Queries() query: QueryReimbursementRequestDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest[]>> {
    this.logger.debug('Received request to get ReimbursementRequest(s) matching query', { query });
    const { data, pagination } = 
      await reimbursementReqService.getReimbursementRequests(query, req.user!);
    this.logger.info('Returning %d ReimbursementRequest(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a reimbursementRequest by ID
   * @param id reimbursementRequest ID
   * @returns reimbursementRequest
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'ReimbursementRequest does not exist',
    details: [],
  })
  public async getReimbursementRequest(
    @Path('id') id: number, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to get ReimbursementRequest[%s]', id);
    const reimbursementRequest = 
      await reimbursementReqService.getReimbursementRequest(id, req.user!);
    return { data: reimbursementRequest };
  }

  /**
   * Change the details of an existing reimbursementRequest
   * @param id reimbursementRequest ID
   * @param body Request body with reimbursementRequest to update to
   * @returns Updated reimbursementRequest
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
  public async updateReimbursementRequest(
    @Path('id') id: number,
    @Body() updateDto: UpdateReimbursementRequestDto,
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to update ReimbursementRequest[%s]', id);
    const updateReimbursementRequest = await reimbursementReqService.updateReimbursementRequest(
      id, updateDto
    );
    this.logger.info('ReimbursementRequest[%s] updated successfully!', id);
    return { data: updateReimbursementRequest };
  }

  /**
   * Change the details of existing reimbursementRequest and add reimbursementAttachment or comment
   * @param id reimbursementRequest ID
   * @param body Body of update data for reimbursementRequest and attachment or comment to be added
   * @returns Updated reimbursementRequest
   */
  @Post('{id}/response')
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
  public async addResponse(
    @Path('id') id: number,
    @Body() updateDto: ReimbursementResponseInputDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to add response for ReimbursementRequest[%s]', id);
    const updateReimbursementRequest = await reimbursementReqService.addResponse(
      id, updateDto, req.user!
    );
    this.logger.info('Response for ReimbursementRequest[%s] added successfully!', id);
    return { data: updateReimbursementRequest };
  }

  /**
   * Add reimbursementAttachment or comment to an existing ReimbursementRequest
   * @param id reimbursementRequest ID
   * @param body Body of data for reimbursementAttachment or comment to be added
   * @returns reimbursementRequest for which Attachment or comment has been added
   */
  @Post('{id}/updates')
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
  public async postUpdate(
    @Path('id') id: number,
    @Body() updateDto: ReimbursementRequestUpdatesDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to add an update for ReimbursementRequest[%s]', id);
    const updateReimbursementRequest = await reimbursementReqService.postUpdate(
      id, updateDto, req.user!
    );
    this.logger.info('Update posted for ReimbursementRequest[%s] successfully!', id);
    return { data: updateReimbursementRequest };
  }

  /**
   * Complete ReimbursementRequest
   * @param id reimbursementRequest ID
   * @param body Body of data for comment to be added for completion
   * @returns completed reimbursementRequest
   */
  @Post('{id}/completion')
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
  public async completeReimbursementRequest(
    @Path('id') id: number,
    @Body() updateDto: CompleteReimbursementRequestDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest>> {
    this.logger.debug('Received request to complete a ReimbursementRequest[%s]', id);
    const updateReimbursementRequest = await reimbursementReqService.completeRequest(
      id, updateDto, req.user!
    );
    this.logger.info('ReimbursementRequest[%s] completed successfully!', id);
    return { data: updateReimbursementRequest };
  }

  /**
   * Search a reimbursementRequest by title and description
   * 
   * @param searchParam search parameters including title and description
   * @returns reimbursementRequest that match search
   */
  @Get('search')
  public async searchReimbursementRequest(
    @Queries() searchParam: SearchReimbursementRequestDto,  @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<ReimbursementRequest[]>> {
    this.logger.info(
      'Received request to get ReimbursementRequest(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await reimbursementReqService.searchReimbursementRequest(searchParam, req.user!);
    this.logger.info('Returning %d ReimbursementRequest(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing ReimbursementRequest
   * @param id reimbursementRequest ID
   * @returns nothing
   */
  @Delete('{id}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.REIMBURSEMENT_REQUEST_NOT_FOUND,
    message: 'Reimbursement request does not exist',
    details: [],
  })
  public async deleteReimbursementRequest(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete ReimbursementRequest[%s]', id);
    await reimbursementReqService.deleteReimbursementRequest(id);
    this.logger.debug('ReimbursementRequest[%s] deleted successfully', id);
  }
}
