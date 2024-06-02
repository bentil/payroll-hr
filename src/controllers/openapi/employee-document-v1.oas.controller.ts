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
  Delete
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  CreateEmployeeDocumentDto,
  EmployeeDocumentDto,
  QueryEmployeeDocumentDto,
  UpdateEmployeeDocumentDto
} from '../../domain/dto/employee-document.dto';
import * as service from '../../services/employee-document.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';
import { EmployeeDocument } from '@prisma/client';

@Tags('employee-documents')
@Route('/api/v1/employee-documents')
@Security('api_key')
export class EmployeeDocumentV1Controller {
  private readonly logger = rootLogger.child({ context: EmployeeDocumentV1Controller.name, });

  /**
   * Create a employeeDocument
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeDocument(
    @Body() createData: CreateEmployeeDocumentDto
  ): Promise<ApiSuccessResponse<EmployeeDocument>> {
    this.logger.debug('Received request to add EmployeeDocument', { data: createData, });
    const employeeDocument = await service.addEmployeeDocument(createData);
    return { data: employeeDocument };
  }

  /**
   * Get a list of employeeDocument matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching employeeDocument
   */
  @Get()
  public async getEmployeeDocuments(
    @Queries() query: QueryEmployeeDocumentDto
  ): Promise<ApiSuccessResponse<EmployeeDocument[]>> {
    this.logger.debug('Received request to get EmployeeDocument(s) matching query', { query });
    const { data, pagination } = await service.getEmployeeDocuments(query);
    this.logger.info('Returning %d EmployeeDocument(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a employeeDocument by ID
   * @param id employeeDocument ID
   * @returns employeeDocument
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'Employee document does not exist',
    details: [],
  })
  public async getEmployeeDocument(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<EmployeeDocumentDto>> {
    this.logger.debug('Received request to get EmployeeDocument[%s]', id);
    const employeeDocument = await service.getEmployeeDocument(id);
    return { data: employeeDocument };
  }

  /**
   * Change the details of an existing employeeDocument
   * @param id employeeDocument ID
   * @param body Request body with employeeDocument to update to
   * @returns Updated employeeDocument
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
  public async updateEmployeeDocument(
    @Path('id') id: number,
    @Body() updateDto: UpdateEmployeeDocumentDto
  ): Promise<ApiSuccessResponse<EmployeeDocumentDto>> {
    this.logger.debug('Received request to update EmployeeDocument[%s]', id);
    const updatedEmployeeDocument = await service.updateEmployeeDocument(id, updateDto);
    this.logger.info('CompanyDocumentType[%s] updated successfully!', id);
    return { data: updatedEmployeeDocument };
  }

  /**
   * Remove an existing employeeDocument
   * @param id employeeDocument ID
   * @returns nothing
   */
  @Delete('{id}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.EMPLOYEE_DOCUMENT_NOT_FOUND,
    message: 'Employee document does not exist',
    details: [],
  })
  public async deleteEmployeeDocument(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeDocument[%s]', id);
    await service.deleteEmployeeDocument(id);
    this.logger.debug('EmployeeDocument[%s] deleted successfully', id);
  }

}
