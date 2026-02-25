import { EmployeeWorkTimeRequest } from '@prisma/client';
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
  CreateEmployeeWorkTimeRequestDto,
  EmployeeWorkTimeInputDto,
  QueryEmployeeWorkTimeRequestDto,
  UpdateEmployeeWorkTimeRequestDto,
} from '../../domain/dto/employee-work-time-request.dto';
import * as service from '../../services/employee-work-time-request.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('employee-work-time-requests')
@Route('/api/v1/employee-work-time-requests')
@Security('api_key')
export class EmployeeWorkTimeRequestV1Controller {
  private readonly logger = rootLogger.child({ 
    context: EmployeeWorkTimeRequestV1Controller.name, 
  });

  /**
   * Create a EmployeeWorkTimeRequest
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeWorkTimeRequest(
    @Body() createData: CreateEmployeeWorkTimeRequestDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest>> {
    this.logger.debug(
      'Received request to add EmployeeWorkTimeRequest', { data: createData, }
    );
    const employeeWorkTimeRequest = await service.addEmployeeWorkTimeRequest(
      createData, req.user!
    );
    return { data: employeeWorkTimeRequest };
  }

  /**
   * Get a list of EmployeeWorkTimeRequest(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching EmployeeWorkTimeRequest(s)
   */
  @Get()
  public async getEmployeeWorkTimeRequests(
    @Queries() query: QueryEmployeeWorkTimeRequestDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest[]>> {
    this.logger.debug(
      'Received request to get EmployeeWorkTimeRequest(s) matching query', { query }
    );
    const { data, pagination } = await service.getEmployeeWorkTimeRequests(
      query, req.user!
    );
    this.logger.info(
      'Returning %d EmployeeWorkTimeRequest(s) that matched the query', data.length
    );
    return { data, pagination };
  }

  /**
   * Get a EmployeeWorkTimeRequest by ID
   * @param id EmployeeWorkTimeRequest ID
   * @returns EmployeeWorkTimeRequest
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'EmployeeWorkTimeRequest does not exist',
    details: [],
  })
  public async getEmployeeWorkTimeRequest(
    @Path('id') id: number, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest>> {
    this.logger.debug('Received request to get EmployeeWorkTimeRequest[%s]', id);
    const employeeWorkTimeRequest = await service.getEmployeeWorkTimeRequest(
      id, req.user!
    );
    return { data: employeeWorkTimeRequest };
  }

  /**
   * Change the details of an existing EmployeeWorkTimeRequest
   * @param id EmployeeWorkTimeRequest ID
   * @param body Request body with EmployeeWorkTimeRequest to update to
   * @returns Updated EmployeeWorkTimeRequest
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
  public async updateEmployeeWorkTimeRequest(
    @Path('id') id: number,
    @Body() updateDto: UpdateEmployeeWorkTimeRequestDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest>> {
    this.logger.debug('Received request to update EmployeeWorkTimeRequest[%s]', id);
    const updateEmployeeWorkTimeRequest = 
      await service.updateEmployeeWorkTimeRequest(id, updateDto, req.user!);
    this.logger.info('EmployeeWorkTimeRequest[%s] updated successfully!', id);
    return { data: updateEmployeeWorkTimeRequest };
  }

  /**
   * Remove an existing EmployeeWorkTimeRequest
   * @param id EmployeeWorkTimeRequest ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.LEAVE_REQUEST_NOT_FOUND,
    message: 'EmployeeWorkTimeRequest does not exist',
    details: [],
  })
  public async deleteEmployeeWorkTimeRequest(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeWorkTimeRequest[%s]', id);
    await service.deleteEmployeeWorkTimeRequest(id, req.user!);
    this.logger.debug('EmployeeWorkTimeRequest[%s] deleted successfully', id);
  }

  /**
   * Change the details of an existing EmployeeWorkTimeRequest while adding leaveResponse
   * @param id EmployeeWorkTimeRequest ID
   * @param body Request body with details to update to and LeaveResponse to be added
   * @returns Updated EmployeeWorkTimeRequest
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
  public async addEmployeeWorkTimeResponse(
    @Path('id') id: number,
    @Body() updateDto: EmployeeWorkTimeInputDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest>> {
    this.logger.debug(
      'Received request to add LeaveResponse for EmployeeWorkTimeRequest[%s]', id
    );
    const updateEmployeeWorkTimeRequest = await service.addEmployeeWorkTimeResponse(
      id, updateDto, req.user!
    );
    this.logger.info('LeaveResponse for EmployeeWorkTimeRequest[%s] successfully!', id);
    return { data: updateEmployeeWorkTimeRequest };
  }

  /**
   * Cancel a pending or approved EmployeeWorkTimeRequest
   * @param id EmployeeWorkTimeRequest ID
   * @returns Updated EmployeeWorkTimeRequest
   */
  @Post('{id}/cancel')
  public async cancelEmployeeWorkTimeRequest(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTimeRequest>> {
    this.logger.debug('Received request to cancel EmployeeWorkTimeRequest[%s]', id);
    const employeeWorkTimeRequest = await service.cancelEmployeeWorkTimeRequest(
      id, req.user!
    );
    this.logger.info('EmployeeWorkTimeRequest[%s] cancelled successfully!', id);
    return { data: employeeWorkTimeRequest };
  }

}
