import { LeaveRequest } from '@prisma/client';
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
  CreateLeaveRequestDto,
  QueryLeaveRequestDto,
  UpdateLeaveRequestDto,
  ResponseObjectDto,
} from '../../domain/dto/leave-request.dto';
import * as leaveReqService from '../../services/leave-request.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('leave-requests')
@Route('/api/v1/leave-requests')
@Security('api_key')
export class LeaveRequestV1Controller {
  private readonly logger = rootLogger.child({ context: LeaveRequestV1Controller.name, });

  /**
   * Create a leave request
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addLeaveRequest(
    @Body() createData: CreateLeaveRequestDto, 
  ): Promise<ApiSuccessResponse<LeaveRequest>> {
    this.logger.debug('Received request to add LeaveRequest', { data: createData, });
    const leaveRequest = await leaveReqService.addLeaveRequest(createData);
    return { data: leaveRequest };
  }

  /**
   * Get a list of leave request matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching leave request
   */
  @Get()
  public async getLeaveRequests(
    @Queries() query: QueryLeaveRequestDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveRequest[]>> {
    this.logger.debug('Received request to get LeaveRequest(s) matching query', { query });
    const { data, pagination } = await leaveReqService.getLeaveRequests(query, req.user!);
    this.logger.info('Returning %d LeaveRequest(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a leaveRequest by ID
   * @param id leaveRequest ID
   * @returns leaveRequest
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'LeaveRequest does not exist',
    details: [],
  })
  public async getLeaveRequest(
    @Path('id') id: number, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveRequest>> {
    this.logger.debug('Received request to get LeaveRequest[%s]', id);
    const leaveRequest = await leaveReqService.getLeaveRequest(id, req.user!);
    return { data: leaveRequest };
  }

  /**
   * Change the details of an existing leaveRequest
   * @param id leaveRequest ID
   * @param body Request body with leaveRequest to update to
   * @returns Updated leaveRequest
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
  public async updateLeaveRequest(
    @Path('id') id: number,
    @Body() updateDto: UpdateLeaveRequestDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveRequest>> {
    this.logger.debug('Received request to update LeaveRequest[%s]', id);
    const updateLeaveRequest = await leaveReqService.updateLeaveRequest(id, updateDto, req.user!);
    this.logger.info('LeaveRequest[%s] updated successfully!', id);
    return { data: updateLeaveRequest };
  }

  /**
   * Remove an existing LeaveRequest
   * @param id leaveRequest ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.LEAVE_REQUEST_NOT_FOUND,
    message: 'LeaveRequest does not exist',
    details: [],
  })
  public async deleteLeaveRequest(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete LeaveRequest[%s]', id);
    await leaveReqService.deleteLeaveRequest(id);
    this.logger.debug('LeaveRequest[%s] deleted successfully', id);
  }

  /**
   * Change the details of an existing leaveRequest while adding leaveResponse
   * @param id leaveRequest ID
   * @param body Request body with leaveRequest to update to and leaveResponse to be added
   * @returns Updated leaveRequest
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
  public async addLeaveResponse(
    @Path('id') id: number,
    @Body() updateDto: ResponseObjectDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveRequest>> {
    this.logger.debug('Received request to add LeaveResponse for LeaveRequest[%s]', id);
    const updateLeaveRequest = await leaveReqService.addLeaveResponse(id, updateDto, req.user!);
    this.logger.info('LeaveResponse for LeaveRequest[%s] successfully!', id);
    return { data: updateLeaveRequest };
  }

  /**
   * Cancel a pending or approved leaveRequest
   * @param id leaveRequest ID
   * @returns Updated leaveRequest
   */
  public async cancelLeaveRequest(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeaveRequest>> {
    this.logger.debug('Received request to cancel LeaveRequest[%s]', id);
    const leaveRequest = await leaveReqService.cancelLeaveRequest(id, req.user!);
    this.logger.info('LeaveRequest[%s] cancelled successfully!', id);
    return { data: leaveRequest };
  }

}
