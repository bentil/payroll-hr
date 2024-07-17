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
  Delete
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  GetOneEmployeeApproverDto,
  QueryEmployeeApproverDto,
  UpdateEmployeeApproverDto
} from '../../domain/dto/employee-approver.dto';
import * as service from '../../services/employee-approver.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';
import { EmployeeApprover } from '@prisma/client';

@Tags('employee-approvers')
@Route('/api/v1/employees/{employeeId}/approvers')
@Security('api_key')
export class EmployeeApproverV1Controller {
  private readonly logger = rootLogger.child({ context: EmployeeApproverV1Controller.name, });

  /**
   * Create a EmployeeApprover
   * 
   * @param employeeId 
   * @param createData Request body
   * @param req Request object
   * @returns EmployeeApprover
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addEmployeeApprover(
    @Path('employeeId') employeeId: number,
    @Body() createData: CreateEmployeeApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeApprover>> {
    this.logger.debug('Received request to add EmployeeApprover', { data: createData, });
    const employeeApprover = await service.createEmployeeApprover(
      createData, 
      employeeId, 
      req.user!
    );
    return { data: employeeApprover };
  }

  /**
   * Get a list of EmployeeApprover(s) matching query
   * 
   * @param employeeId 
   * @param query Request query parameters, including pagination and ordering details
   * @param req Request object
   * @returns List of matching EmployeeApprover(s)
   */
  @Get()
  public async getEmployeeApprovers(
    @Path('employeeId') employeeId:number,
    @Queries() query: QueryEmployeeApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeApproverDto[]>> {
    this.logger.debug('Received request to get EmployeeApprover(s) matching query', { query });
    const { data, pagination } = await service.getEmployeeApprovers(employeeId, query, req.user!);
    this.logger.info('Returning %d EmployeeApprover(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get an EmployeeApprover by Id
   * 
   * @param id EmployeeApprover Id
   * @param employeeId Employee Id
   * @param query Request query parameter of inverse
   * @returns EmployeeApprover
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'Employee approver does not exist',
    details: [],
  })
  public async getEmployeeApprover(
    @Path('id') id: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: GetOneEmployeeApproverDto,
  ): Promise<ApiSuccessResponse<EmployeeApproverDto>> {
    this.logger.debug('Received request to get EmployeeApprover[%s]', id);
    const employeeApprover = await service.getEmployeeApproverId(id, employeeId, query);
    return { data: employeeApprover };
  }

  /**
   * Change details of an existing EmployeeApprover
   * 
   * @param id EmployeeApprover Id
   * @param employeeId Employee Id
   * @param updateDto Request body with details to update
   * @param req Request object
   * @returns Updated EmployeeApprover
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
  public async updateEmployeeApprover(
    @Path('id') id: number,
    @Path('employeeId') employeeId: number,
    @Body() updateDto: UpdateEmployeeApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeApproverDto>> {
    this.logger.debug('Received request to update EmployeeApprover[%s]', id);
    const updatedEmployeeApprover = await service.updateEmployeeApprover(
      id, employeeId, updateDto, req.user!
    );
    this.logger.info('EmployeeApprover[%s] updated successfully!', id);
    return { data: updatedEmployeeApprover };
  }

  /**
   * Remove an existing EmployeeApprover
   * 
   * @param id EmployeeApprover ID
   * @returns nothing
   */
  @Delete('{id}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.EMPLOYEE_DOCUMENT_NOT_FOUND,
    message: 'Employee approver does not exist',
    details: [],
  })
  public async deleteEmployeeApprover(
    @Path('id') id: number,
    @Path('employeeId') employeeId: number,
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeApprover[%s]', id);
    await service.deleteEmployeeApprover(id, employeeId);
    this.logger.debug('EmployeeApprover[%s] deleted successfully', id);
  }

}
