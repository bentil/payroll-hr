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
  SuccessResponse,
  Tags,
  Delete,
  Security,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import * as leavePackageservice from '../../services/leave-package.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';
import {
  CreateLeavePackageDto,
  LeavePackageDto,
  QueryLeavePackageDto,
  SearchLeavePackageDto,
  UpdateLeavePackageDto
} from '../../domain/dto/leave-package.dto';
import { IncludeCompanyLevelsQueryDto } from '../../domain/dto/leave-type.dto';


@Tags('leave-packages')
@Route('/api/v1/leave-packages')
@Security('api_key')
export class LeavePackageV1Controller {
  private readonly logger = rootLogger.child({ context: LeavePackageV1Controller.name });

  /**
* Add a LeavePackage
* 
* @param createData Request body
* @returns LeavePackage
*/
  @Post()
  @SuccessResponse(201, 'Created')
  public async addLeavePackage(
    @Body() createData: CreateLeavePackageDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeavePackageDto>> {
    this.logger.debug('Received request to add leavePackage');
    const leavePackage =
      await leavePackageservice.createLeavePackage(createData, req.user!);
    return { data: leavePackage };
  }

  /**
   * Update an existing LeavePackage
   *
   * @param id LeavePackage ID
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
    * Get a list of LeavePackage(s) matching query
    * 
    * @param query Query parameters, including pagination and ordering details
    * @returns List of matching LeavePackage(s)
    */

  @Get()
  public async getLeavePackages(
    @Queries() query: QueryLeavePackageDto
  ): Promise<ApiSuccessResponse<LeavePackageDto[]>> {
    this.logger.info('Received request to get leave package matching query', { query });
    const { data, pagination } = await leavePackageservice.getLeavePackages(query);
    this.logger.info('Returning %d leave package that matched query', data.length);
    return { data, pagination };
  }

  /**
      * Get a LeavePackage by ID,the includeCompanyLevels param
      * can be also be specified to fetch 
      * CompanyLevels related to the LeavePackage
      * 
      * @param id LeavePackage ID
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
     * Search for LeavePackage(s) by name,code or description
     * 
     * @param s code/name/description
     * @returns LeavePackage(s)
     */
  @Get('search')
  public async searchLeavePackages(
    @Queries() query: SearchLeavePackageDto
  ): Promise<ApiSuccessResponse<LeavePackageDto[]>> {
    this.logger.debug('Received request to get leave-package matching search query', { query });
    const { data, pagination } =
      await leavePackageservice.searchLeavePackages(query);
    return { data, pagination };
  }


  /**
      * Delete a LeavePackage by ID
      * 
      * @param id LeavePackage ID
      * @returns empty body
      */
  @Delete('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Leave Package you are attempting to delete does not exist',
    details: [],
  })
  @SuccessResponse(204, 'No Content')
  public async deleteLeavePackage(@Path('id') id: number): Promise<void> {
    this.logger.info('Received request to delete LeavePackage[%s]', id);
    await leavePackageservice.deleteLeavePackage(id);
  }

}