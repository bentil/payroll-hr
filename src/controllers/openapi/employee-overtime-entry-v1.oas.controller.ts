import { EmployeeOvertimeEntry } from '@prisma/client';
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
  CreateEmployeeOvertimeEntryDto,
  QueryEmployeeOvertimeEntryDto,
  UpdateEmployeeOvertimeEntryDto,
} from '../../domain/dto/employee-overtime-entry.dto';
import * as service from '../../services/employee-overtime-entry.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('employee-overtime-entries')
@Route('/api/v1/employee-overtime-entries')
@Security('api_key')
export class EmployeeOvertimeEntryV1Controller {
  private readonly logger = rootLogger.child({ context: EmployeeOvertimeEntryV1Controller.name, });

  /**
   * Create a EmployeeOvertimeEntry
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeOvertimeEntry(
    @Body() createData: CreateEmployeeOvertimeEntryDto
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntry>> {
    this.logger.debug('Received request to add EmployeeOvertimeEntry', { data: createData, });
    const employeeOvertimeEntry = await service.addEmployeeOvertimeEntry(createData);
    return { data: employeeOvertimeEntry };
  }

  /**
   * Get a list of EmployeeOvertimeEntry(ies) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching EmployeeOvertimeEntry(ies)
   */
  @Get()
  public async getEmployeeOvertimeEntries(
    @Queries() query: QueryEmployeeOvertimeEntryDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntry[]>> {
    this.logger.debug(
      'Received request to get EmployeeOvertimeEntry(ies) matching query', { query }
    );
    const { data, pagination } = await service.getEmployeeOvertimeEntries(query, req.user!);
    this.logger.info('Returning %d EmployeeOvertimeEntry(ies) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a EmployeeOvertimeEntry by ID
   * @param id EmployeeOvertimeEntry ID
   * @returns EmployeeOvertimeEntry
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
    details: [],
  })
  public async getEmployeeOvertimeEntry(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntry>> {
    this.logger.debug('Received request to get EmployeeOvertimeEntry[%s]', id);
    const employeeOvertimeEntry = await service.getEmployeeOvertimeEntry(id);
    return { data: employeeOvertimeEntry };
  }

  /**
   * Change the details of an existing EmployeeOvertimeEntry
   * @param id EmployeeOvertimeEntry ID
   * @param body Request body with details to update to
   * @returns Updated EmployeeOvertimeEntry
   */
  @Patch('{id}')
  @Response<ApiErrorResponse>(400, 'Bad Request', {
    error: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: 'INVALID_STATE',
    message: 'Resource of interest is in an invalid state',
    details: [],
  })
  public async updateEmployeeOvertimeEntry(
    @Path('id') id: number,
    @Body() updateDto: UpdateEmployeeOvertimeEntryDto
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntry>> {
    this.logger.debug('Received request to update EmployeeOvertimeEntry[%s]', id);
    const updatedEmployeeOvertimeEntry = await service.updateEmployeeOvertimeEntry(id, updateDto);
    this.logger.info('EmployeeOvertimeEntry[%s] updated successfully!', id);
    return { data: updatedEmployeeOvertimeEntry };
  }

  /**
   * Remove an existing EmployeeOvertimeEntry
   * @param id EmployeeOvertimeEntry ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND,
    message: 'Employee overtime entry does not exist',
    details: [],
  })
  public async deleteEmployeeOvertimeEntry(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeOvertimeEntry[%s]', id);
    await service.deleteEmployeeOvertimeEntry(id);
    this.logger.debug('EmployeeOvertimeEntry[%s] deleted successfully', id);
  }

}
