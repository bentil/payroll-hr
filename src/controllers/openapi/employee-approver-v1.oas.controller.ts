import { EmployeeApprover } from '@prisma/client';
import {
  Body,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Queries,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import {
  ApiErrorResponse,
  ApiSuccessResponse
} from '../../domain/api-responses';
import {
  CreateEmployeeApproverDto,
  EmployeeApproverDto,
  EmployeeApproverPreflightResponseDto,
  GetOneEmployeeApproverDto,
  QueryEmployeeApproverDto,
  UpdateEmployeeApproverDto
} from '../../domain/dto/employee-approver.dto';
import * as service from '../../services/employee-approver.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';

@Tags('employee-approvers')
@Route('/api/v1/employees/{employeeId}/approvers')
@Security('api_key')
export class EmployeeApproverV1Controller {
  private readonly logger = rootLogger.child({
    context: EmployeeApproverV1Controller.name,
  });

  /**
   * Check if a request to add an approver will be successful or not
   * 
   * @param employeeId Employee ID
   * @param dtoData Request body with details for preflight
   * @param req Request object
   * @returns Warning and error messages if any
   */
  @Post('/preflight')
  public async employeeApproverPreflight(
    @Path('employeeId') employeeId: number,
    @Body() dtoData: CreateEmployeeApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeApproverPreflightResponseDto>> {
    this.logger.debug(
      'Received EmployeeApprover preflight request for Employee[%s]',
      employeeId
    );
    const data = await service.employeeApproverPreflight(
      employeeId, dtoData, req.user!
    );
    this.logger.info(
      'Preflight request for Employee[%s] done successfully!',
      employeeId
    );
    return { data };
  }

  /**
   * Add an Employee approver
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
    this.logger.debug(
      'Received request to add EmployeeApprover',
      { data: createData }
    );
    const employeeApprover = await service.createEmployeeApprover( 
      employeeId,
      createData, 
      req.user!
    );
    return { data: employeeApprover };
  }

  /**
   * Get a list of EmployeeApprover(s) matching query
   * 
   * @param employeeId Employee or approver id, depending on 'inverse' value
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
    this.logger.debug(
      'Received request to get EmployeeApprover(s) matching query',
      { query }
    );
    const {
      data,
      pagination
    } = await service.getEmployeeApprovers(employeeId, query, req.user!);
    this.logger.info(
      'Returning %d EmployeeApprover(s) that matched query',
      data.length
    );
    return { data, pagination };
  }

  /**
   * Get an EmployeeApprover by id
   * 
   * @param id EmployeeApprover id
   * @param employeeId Employee Id
   * @param query Request query parameters
   * @param req Request object
   * @returns EmployeeApprover
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Employee approver does not exist',
    details: [],
  })
  public async getEmployeeApprover(
    @Path('id') id: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: GetOneEmployeeApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<EmployeeApproverDto>> {
    this.logger.debug('Received request to get EmployeeApprover[%s]', id);
    const employeeApprover = await service.getEmployeeApprover(
      id,
      employeeId,
      query,
      req.user!
    );
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
    error: errors.REQUEST_VALIDATION_FAILED,
    message: 'Request validation failed',
    details: ['fieldA is required', 'fieldB must not be blank'],
  })
  @Response<ApiErrorResponse>(409, 'Conflict', {
    error: errors.INVALID_STATE,
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
      id,
      employeeId,
      updateDto,
      req.user!
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
    error: errors.EMPLOYEE_APPROVER_NOT_FOUND,
    message: 'Employee approver does not exist',
    details: [],
  })
  public async deleteEmployeeApprover(
    @Path('id') id: number,
    @Path('employeeId') employeeId: number,
    @Request() req: Express.Request
  ): Promise<void> {
    this.logger.debug('Received request to delete EmployeeApprover[%s]', id);
    await service.deleteEmployeeApprover(id, employeeId, req.user!);
    this.logger.debug('EmployeeApprover[%s] deleted successfully', id);
  }
}
