import { CompanyApprover } from '@prisma/client';
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
  CreateCompanyApproverDto,
  CompanyApproverDto,
  QueryCompanyApproverDto,
  UpdateCompanyApproverDto
} from '../../domain/dto/company-approver.dto';
import * as service from '../../services/company-approver.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';

@Tags('company-approvers')
@Route('/api/v1/payroll-companies/{companyId}/approvers')
@Security('api_key')
export class CompanyApproverV1Controller {
  private readonly logger = rootLogger.child({
    context: CompanyApproverV1Controller.name,
  });
  /**
   * Add a Company approver
   * 
   * @param companyId 
   * @param createData Request body
   * @param req Request object
   * @returns CompanyApprover
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addCompanyApprover(
    @Path('companyId') companyId: number,
    @Body() createData: CreateCompanyApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<CompanyApprover>> {
    this.logger.debug(
      'Received request to add CompanyApprover',
      { data: createData }
    );
    const companyApprover = await service.createCompanyApprover( 
      companyId,
      createData, 
      req.user!
    );
    return { data: companyApprover };
  }

  /**
   * Get a list of CompanyApprover(s) matching query
   * 
   * @param companyId Company or approver id, depending on 'inverse' value
   * @param query Request query parameters, including pagination and ordering details
   * @param req Request object
   * @returns List of matching CompanyApprover(s)
   */
  @Get()
  public async getCompanyApprovers(
    @Path('companyId') companyId:number,
    @Queries() query: QueryCompanyApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<CompanyApproverDto[]>> {
    this.logger.debug(
      'Received request to get CompanyApprover(s) matching query',
      { query }
    );
    const {
      data,
      pagination
    } = await service.getCompanyApprovers(companyId, query, req.user!);
    this.logger.info(
      'Returning %d CompanyApprover(s) that matched query',
      data.length
    );
    return { data, pagination };
  }

  /**
   * Get an CompanyApprover by id
   * 
   * @param id CompanyApprover id
   * @param companyId Company Id
   * @param query Request query parameters
   * @param req Request object
   * @returns CompanyApprover
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'Company approver does not exist',
    details: [],
  })
  public async getCompanyApprover(
    @Path('id') id: number,
    @Path('companyId') companyId: number,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<CompanyApproverDto>> {
    this.logger.debug('Received request to get CompanyApprover[%s]', id);
    const companyApprover = await service.getCompanyApprover(
      id,
      companyId,
      req.user!
    );
    return { data: companyApprover };
  }

  /**
   * Change details of an existing CompanyApprover
   * 
   * @param id CompanyApprover Id
   * @param companyId Company Id
   * @param updateDto Request body with details to update
   * @param req Request object
   * @returns Updated CompanyApprover
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
  public async updateCompanyApprover(
    @Path('id') id: number,
    @Path('companyId') companyId: number,
    @Body() updateDto: UpdateCompanyApproverDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<CompanyApproverDto>> {
    this.logger.debug('Received request to update CompanyApprover[%s]', id);
    const updatedCompanyApprover = await service.updateCompanyApprover(
      id,
      companyId,
      updateDto,
      req.user!
    );
    this.logger.info('CompanyApprover[%s] updated successfully!', id);
    return { data: updatedCompanyApprover };
  }

  /**
   * Remove an existing CompanyApprover
   * 
   * @param id CompanyApprover ID
   * @returns nothing
   */
  @Delete('{id}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.EMPLOYEE_APPROVER_NOT_FOUND,
    message: 'Company approver does not exist',
    details: [],
  })
  public async deleteCompanyApprover(
    @Path('id') id: number,
    @Path('companyId') companyId: number,
    @Request() req: Express.Request
  ): Promise<void> {
    this.logger.debug('Received request to delete CompanyApprover[%s]', id);
    await service.deleteCompanyApprover(id, companyId, req.user!);
    this.logger.debug('CompanyApprover[%s] deleted successfully', id);
  }
}
