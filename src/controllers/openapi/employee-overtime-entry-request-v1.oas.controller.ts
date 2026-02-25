import { EmployeeOvertimeEntryRequest } from '@prisma/client';
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
  CreateEmployeeOvertimeEntryRequestDto,
  EmployeeOvertimeEntryInputDto,
  QueryEmployeeOvertimeEntryRequestDto,
  UpdateEmployeeOvertimeEntryRequestDto,
} from '../../domain/dto/employee-overtime-entry-request.dto';
import * as service from '../../services/employee-overtime-entry-request.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('employee-overtime-entry-requests')
@Route('/api/v1/employee-overtime-entry-requests')
@Security('api_key')
export class EmployeeOvertimeEntryRequestV1Controller {
  private readonly logger = rootLogger.child({ 
    context: EmployeeOvertimeEntryRequestV1Controller.name, 
  });

  /**
   * Create a EmployeeOvertimeEntryRequest
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeOvertimeEntryRequest(
    @Body() createData: CreateEmployeeOvertimeEntryRequestDto, 
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest>> {
    this.logger.debug(
      'Received request to add EmployeeOvertimeEntryRequest', { data: createData, }
    );
    const employeeOvertimeEntryRequest = await service.addEmployeeOvertimeEntryRequest(
      createData, req.user!
    );
    return { data: employeeOvertimeEntryRequest };
  }

  /**
   * Get a list of EmployeeOvertimeEntryRequest(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching EmployeeOvertimeEntryRequest(s)
   */
  @Get()
  public async getEmployeeOvertimeEntryRequests(
    @Queries() query: QueryEmployeeOvertimeEntryRequestDto, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest[]>> {
    this.logger.debug(
      'Received request to get EmployeeOvertimeEntryRequest(s) matching query', { query }
    );
    const { data, pagination } = await service.getEmployeeOvertimeEntryRequests(
      query, req.user!
    );
    this.logger.info(
      'Returning %d EmployeeOvertimeEntryRequest(s) that matched the query', data.length
    );
    return { data, pagination };
  }

  /**
   * Get a EmployeeOvertimeEntryRequest by ID
   * @param id EmployeeOvertimeEntryRequest ID
   * @returns EmployeeOvertimeEntryRequest
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'EmployeeOvertimeEntryRequest does not exist',
    details: [],
  })
  public async getEmployeeOvertimeEntryRequest(
    @Path('id') id: number, @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest>> {
    this.logger.debug('Received request to get EmployeeOvertimeEntryRequest[%s]', id);
    const employeeOvertimeEntryRequest = await service.getEmployeeOvertimeEntryRequest(
      id, req.user!
    );
    return { data: employeeOvertimeEntryRequest };
  }

  /**
   * Change the details of an existing EmployeeOvertimeEntryRequest
   * @param id EmployeeOvertimeEntryRequest ID
   * @param body Request body with EmployeeOvertimeEntryRequest to update to
   * @returns Updated EmployeeOvertimeEntryRequest
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
  public async updateEmployeeOvertimeEntryRequest(
    @Path('id') id: number,
    @Body() updateDto: UpdateEmployeeOvertimeEntryRequestDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest>> {
    this.logger.debug('Received request to update EmployeeOvertimeEntryRequest[%s]', id);
    const updateEmployeeOvertimeEntryRequest = 
      await service.updateEmployeeOvertimeEntryRequest(id, updateDto, req.user!);
    this.logger.info('EmployeeOvertimeEntryRequest[%s] updated successfully!', id);
    return { data: updateEmployeeOvertimeEntryRequest };
  }

  /**
   * Remove an existing EmployeeOvertimeEntryRequest
   * @param id EmployeeOvertimeEntryRequest ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.LEAVE_REQUEST_NOT_FOUND,
    message: 'EmployeeOvertimeEntryRequest does not exist',
    details: [],
  })
  public async deleteEmployeeOvertimeEntryRequest(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeOvertimeEntryRequest[%s]', id);
    await service.deleteEmployeeOvertimeEntryRequest(id, req.user!);
    this.logger.debug('EmployeeOvertimeEntryRequest[%s] deleted successfully', id);
  }

  /**
   * Change the details of an existing EmployeeOvertimeEntryRequest while adding leaveResponse
   * @param id EmployeeOvertimeEntryRequest ID
   * @param body Request body with details to update to and LeaveResponse to be added
   * @returns Updated EmployeeOvertimeEntryRequest
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
  public async addEmployeeOvertimeEntryResponse(
    @Path('id') id: number,
    @Body() updateDto: EmployeeOvertimeEntryInputDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest>> {
    this.logger.debug(
      'Received request to add LeaveResponse for EmployeeOvertimeEntryRequest[%s]', id
    );
    const updateEmployeeOvertimeEntryRequest = await service.addEmployeeOvertimeEntryResponse(
      id, updateDto, req.user!
    );
    this.logger.info('LeaveResponse for EmployeeOvertimeEntryRequest[%s] successfully!', id);
    return { data: updateEmployeeOvertimeEntryRequest };
  }

  /**
   * Cancel a pending or approved EmployeeOvertimeEntryRequest
   * @param id EmployeeOvertimeEntryRequest ID
   * @returns Updated EmployeeOvertimeEntryRequest
   */
  @Post('{id}/cancel')
  public async cancelEmployeeOvertimeEntryRequest(
    @Path('id') id: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntryRequest>> {
    this.logger.debug('Received request to cancel EmployeeOvertimeEntryRequest[%s]', id);
    const employeeOvertimeEntryRequest = await service.cancelEmployeeOvertimeEntryRequest(
      id, req.user!
    );
    this.logger.info('EmployeeOvertimeEntryRequest[%s] cancelled successfully!', id);
    return { data: employeeOvertimeEntryRequest };
  }

}
