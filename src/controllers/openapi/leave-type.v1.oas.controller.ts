import {
  Body,
  Get,
  Patch,
  Path,
  Post,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
  Request,
  Delete,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import * as leaveTypeService from '../../services/leave-type.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';
import { Request as expressRequest } from 'express';
import {
  CreateLeaveTypeDto,
  LeaveTypeDto,
  UpdateLeaveTypeDto,
  QueryLeaveTypeDto,
  SearchLeaveTypeDto
} from '../../domain/dto/leave-type.dto';


@Tags('Leave Types')
@Route('/api/v1/leave-types')
export class LeaveTypeV1Controller {
  private readonly logger = rootLogger.child({ context: LeaveTypeV1Controller.name });

  /**
* Add a leave type
* 
* @param createData Request body
* @returns LeaveType
*/
  @Post()
  @SuccessResponse(201, 'Created')
  public async addLeaveType(
    @Body() createData: CreateLeaveTypeDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeaveTypeDto>> {
    this.logger.debug('Received request to add leaveType');
    const leaveType = await leaveTypeService.createLeaveType(createData, request.user!);
    return { data: leaveType };
  }

  /**
   * Update an existing leave type
   *
   * @param id leaveType ID
   * @param updateDto Request body with details to update
   * @returns Updated LeaveType
   */
  @Patch('{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: errors.REQUEST_VALIDATION_FAILED,
    message: 'Request validation failed',
    details: [
      'fieldA is required',
      'fieldB must not be blank',
    ]
  })
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'LeaveType to update does not exist',
    details: [],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: errors.INVALID_STATE,
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateLeaveType(
    @Path('id') id: number,
    @Body() payload: UpdateLeaveTypeDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeaveTypeDto>> {
    this.logger.debug('Received request to update leaveType');
    const leaveType = await leaveTypeService.updateLeaveType(id, payload, request.user!);
    return { data: leaveType };
  }

  /**
    * Get a list of leave types matching query
    * 
    * @param query Query parameters, including pagination and ordering details
    * @returns List of matching leave type
    */

  @Get()
  public async getLeaveTypes(
    @Queries() query: QueryLeaveTypeDto,
      //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeaveTypeDto[]>> {
    this.logger.info('Received request to get leaveType matching query', { query });
    const { data, pagination } = await leaveTypeService.getLeaveTypes(query/*, request.user!*/);
    this.logger.info('Returning %d leaveType that matched query', data.length);
    return { data, pagination };
  }

  /**
      * Get a leave type by ID
      * 
      * @param id leaveType ID
      * @returns LeaveType
      */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Leave Type does not exist',
    details: [],
  })
  public async getLeaveTypeById(
    @Path('id') id: number,
      //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeaveTypeDto>> {
    this.logger.info('Received request to get LeaveType[%s]', id);
    const leaveType = await leaveTypeService.getLeaveTypeById(id/*, request.user!*/);
    return { data: leaveType };
  }

  /**
     * Search an leave type by name,code or description
     * 
     * @param s code/name/description
     * @returns LeaveType
     */
  @Get('search')
  public async searchLeaveType(
    @Queries() query: SearchLeaveTypeDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeaveTypeDto[]>> {
    this.logger.info('Received request to get leave-type matching search query', { query });
    const { data, pagination } = await leaveTypeService.searchLeaveTypes(query, request.user!);
    return { data, pagination };
  }


  /**
      * Delete a leave type by ID
      * 
      * @param id leave type ID
      * @returns empty body
      */
  @Delete('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Leave Type you are attempting to delete does not exist',
    details: [],
  })
  @SuccessResponse(204, 'No Content')
  public async deleteLeaveType(
    @Path('id') id: number,
    @Request() request: expressRequest
  ): Promise<void> {
    this.logger.info('Received request to delete LeaveType[%s]', id);
    await leaveTypeService.deleteLeaveType(id, request.user!);
  }


}