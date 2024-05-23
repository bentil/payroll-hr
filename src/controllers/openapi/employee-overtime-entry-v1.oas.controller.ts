import { EmployeeOvertimeEntry } from '@prisma/client';
import {
  Body,
  Get,
  Patch,
  Path,
  Post,
  Queries,
  Response,
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
   * Create a employeeOvertimeEntry
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
   * Get a list of employeeOvertimeEntry matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching employeeOvertimeEntries
   */
  @Get()
  public async getEmployeeOvertimeEntries(
    @Queries() query: QueryEmployeeOvertimeEntryDto
  ): Promise<ApiSuccessResponse<EmployeeOvertimeEntry[]>> {
    this.logger.debug(
      'Received request to get EmployeeOvertimeEntry(ies) matching query', { query }
    );
    const { data, pagination } = await service.getEmployeeOvertimeEntries(query);
    this.logger.info('Returning %d EmployeeOvertimeEntry(ies) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a employeeOvertimeEntry by ID
   * @param id employeeOvertimeEntry ID
   * @returns employeeOvertimeEntry
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
   * Change the details of an existing employeeOvertimeEntry
   * @param id employeeOvertimeEntry ID
   * @param body Request body with employeeOvertimeEntry to update to
   * @returns Updated employeeOvertimeEntry
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
   * Remove an existing employeeOvertimeEntry
   * @param id employeeOvertimeEntry ID
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
