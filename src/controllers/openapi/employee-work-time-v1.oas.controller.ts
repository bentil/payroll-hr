import { EmployeeWorkTime } from '@prisma/client';
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
  CreateEmployeeWorkTimeDto, 
  QueryEmployeeWorkTimeDto,
  UpdateEmployeeWorkTimeDto
} from '../../domain/dto/employee-work-time.dto';
import * as service from '../../services/employee-work-time.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('employee-work-times')
@Route('/api/v1/employee-work-times')
@Security('api_key')
export class EmployeeWorkTimeV1Controller {
  private readonly logger = rootLogger.child({ context: EmployeeWorkTimeV1Controller.name, });

  /**
   * Create a employee work time
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeWorkTime(
    @Body() createData: CreateEmployeeWorkTimeDto
  ): Promise<ApiSuccessResponse<EmployeeWorkTime>> {
    this.logger.debug('Received request to add EmployeeWorkTime', { data: createData, });
    const employeeWorkTime = await service.addEmployeeWorkTime(createData);
    return { data: employeeWorkTime };
  }

  /**
   * Get a list of employeeWorkTime matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching employeeWorkTimes
   */
  @Get()
  public async getEmployeeWorkTimes(
    @Queries() query: QueryEmployeeWorkTimeDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeWorkTime[]>> {
    this.logger.debug(
      'Received request to get EmployeeWorkTime(s) matching query', { query }
    );
    const { data, pagination } = await service.getEmployeeWorkTimes(query, req.user!);
    this.logger.info('Returning %d EmployeeWorkTime(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a employeeWorkTime by ID
   * @param id employeeWorkTime ID
   * @returns employeeWorkTime
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
    details: [],
  })
  public async getEmployeeWorkTime(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<EmployeeWorkTime>> {
    this.logger.debug('Received request to get EmployeeWorkTime[%s]', id);
    const employeeWorkTime = await service.getEmployeeWorkTime(id);
    return { data: employeeWorkTime };
  }

  /**
   * Change the details of an existing employeeWorkTime
   * @param id employeeWorkTime ID
   * @param body Request body with employeeWorkTime to update to
   * @returns Updated employeeWorkTime
   */
  @Patch('{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: 'INVALID_STATE',
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateEmployeeWorkTime(
    @Path('id') id: number,
    @Body() updateDto: UpdateEmployeeWorkTimeDto
  ): Promise<ApiSuccessResponse<EmployeeWorkTime>> {
    this.logger.debug('Received request to update EmployeeWorkTime[%s]', id);
    const updatedEmployeeWorkTime = await service.updateEmployeeWorkTime(id, updateDto);
    this.logger.info('EmployeeWorkTime[%s] updated successfully!', id);
    return { data: updatedEmployeeWorkTime };
  }

  /**
   * Remove an existing employeeWorkTime
   * @param id employeeWorkTime ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.EMPLOYEE_WORK_TIME_NOT_FOUND,
    message: 'Employee work time does not exist',
    details: [],
  })
  public async deleteEmployeeWorkTime(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeWorkTime[%s]', id);
    await service.deleteEmployeeWorkTime(id);
    this.logger.debug('EmployeeWorkTime[%s] deleted successfully', id);
  }

}
