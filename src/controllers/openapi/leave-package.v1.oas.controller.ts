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
import * as leavePackageservice from '../../services/leave-package.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';
import { Request as expressRequest } from 'express';
import {
  CreateLeavePackageDto,
  LeavePackageDto,
  QueryLeavePackageDto,
  SearchLeavePackageDto,
  UpdateLeavePackageDto
} from '../../domain/dto/leave-package.dto';
import { IncludeCompanyLevelsQueryDto } from '../../domain/dto/leave-type.dto';


@Tags('Leave Packages')
@Route('/api/v1/leave-packages')
export class LeavePackageV1Controller {
  private readonly logger = rootLogger.child({ context: LeavePackageV1Controller.name });

  /**
* Add a leave package
* 
* @param createData Request body
* @returns LeavePackage
*/
  @Post()
  @SuccessResponse(201, 'Created')
  public async addLeavePackage(
    @Body() createData: CreateLeavePackageDto,
    @Request() request: expressRequest):
    Promise<ApiSuccessResponse<LeavePackageDto>> {
    this.logger.debug('Received request to add leavePackage');
    const leavePackage =
      await leavePackageservice.createLeavePackage(createData, request.user!);
    return { data: leavePackage };
  }

  /**
   * Update an existing leave package
   *
   * @param id leavePackage ID
   * @param updateDto Request body with details to update
   * @returns Updated LeavePackage
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
    message: 'LeavePackage to update does not exist',
    details: [],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: errors.INVALID_STATE,
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateLeavePackage(
    @Path('id') id: number,
    @Body() payload: UpdateLeavePackageDto,
      //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeavePackageDto>> {
    this.logger.debug('Received request to update leavePackage');
    const leavePackage =
      await leavePackageservice.updateLeavePackage(id, payload/*, request.user*/);
    return { data: leavePackage };
  }

  /**
    * Get a list of leave packages matching query
    * 
    * @param query Query parameters, including pagination and ordering details
    * @returns List of matching Leave packages
    */

  @Get()
  public async getLeavePackages(
    @Queries() query: QueryLeavePackageDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeavePackageDto[]>> {
    this.logger.info('Received request to get leave package matching query', { query });
    const { data, pagination } = await leavePackageservice.getLeavePackages(query, request.user!);
    this.logger.info('Returning %d leave package that matched query', data.length);
    return { data, pagination };
  }

  /**
      * Get a leave package by ID,the includeCompanyLevels param
      * can be also be specified to fetch 
      * CompanyLevels related to the leave package
      * 
      * @param id leavePackage ID
      * @param query Query param
      * @returns LeavePackage with CompanyLevels object if includeCompanyLevels true
      */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Leave Package does not exist',
    details: [],
  })
  public async getLeavePackageById(
    @Path('id') id: number,
    @Queries() query: IncludeCompanyLevelsQueryDto,
      //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeavePackageDto>> {
    this.logger.info('Received request to get LeavePackage[%s]', id);
    const leavePackage =
      await leavePackageservice.getLeavePackageById(id, query/*, request.user*/);
    return { data: leavePackage };
  }

  /**
     * Search an leave package by name,code or description
     * 
     * @param s code/name/description
     * @returns LeavePackage
     */
  @Get('search')
  public async searchLeavePackage(
    @Queries() query: SearchLeavePackageDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<LeavePackageDto[]>> {
    this.logger.info('Received request to get leave-package matching search query', { query });
    const { data, pagination } =
      await leavePackageservice.searchLeavePackages(query, request.user!);
    return { data, pagination };
  }


  /**
      * Delete a leave package by ID
      * 
      * @param id leave package ID
      * @returns empty body
      */
  @Delete('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Leave Package you are attempting to delete does not exist',
    details: [],
  })
  @SuccessResponse(204, 'No Content')
  public async deleteLeavePackage(
    @Path('id') id: number,
    @Request() request: expressRequest
  ): Promise<void> {
    this.logger.info('Received request to delete LeavePackage[%s]', id);
    await leavePackageservice.deleteLeavePackage(id, request.user!);
  }

}