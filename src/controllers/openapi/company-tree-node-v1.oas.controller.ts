import { CompanyTreeNode, Employee } from '@prisma/client';
import {
  Body,
  Delete,
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
import * as service from '../../services/company-tree-node.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';
import { 
  CheckIfSupervisorDto,
  CompanyTreeNodeDto,
  CreateCompanyTreeNodeDto, 
  DeleteCompanyTreeNodeQueryDto, 
  UpdateCompanyTreeNodeDto 
} from '../../domain/dto/company-tree-node.dto';

@Tags('company-tree-nodes')
@Route('/api/v1/payroll-company')
@Security('api_key')
export class CompanyTreeNodeV1Controller {
  private readonly logger = rootLogger.child({ context: CompanyTreeNodeV1Controller.name, });

  /**
   * Create a CompanyTreeNode
   *
   * @param createData Request body
   * @param id CompanyId
   * @returns API response
   */
  @Post('/{id}/tree/nodes')
  @SuccessResponse(201, 'Created')
  public async addCompanyTreeNode(
    @Body() createData: CreateCompanyTreeNodeDto, @Path('id') id: number
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to add CompanyTreeNode', { data: createData, });
    const companyTreeNode = await service.addCompanyTreeNode(createData, id);
    return { data: companyTreeNode };
  }

  /**
   * Get a CompanyTreeNode
   *
   * @param id CompanyId,
   * @returns Get matching CompanyTreeNode
   */
  @Get('/{id}/tree')
  public async getCompanyTree(
    @Path() id: number
  ): Promise<ApiSuccessResponse<CompanyTreeNodeDto>> {
    this.logger.debug('Received request to get CompanyTree for company[%s] matching query', id);
    const companyTree = await service.getCompanyTree(id);
    this.logger.info('Returning CompanyTree for company[%s]', id);
    return { data: companyTree };
  }

  /**
   * Get a CompanyTreeNode by ID
   * @param companyId Company ID
   * @param nodeId  CompanyTreeNode ID
   * @returns CompanyTreeNode
   */
  @Get('/{companyId}/tree/nodes/{nodeId}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.COMPANY_TREE_NODE_NOT_FOUND,
    message: 'CompanyTreeNode does not exist',
    details: [],
  })
  public async getCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to get CompanyTreeNode[%s]', nodeId);
    const companyTreeNode = await service.getCompanyTreeNode(nodeId, companyId);
    return { data: companyTreeNode };
  }

  /**
   * Change the details of an existing CompanyTreeNode
   * @param nodeId CompanyTreeNode ID
   * @param companyId companyId
   * @param body Request body with CompanyTreeNode to update to
   * @returns Updated CompanyTreeNode
   */
  @Patch('/{companyId}/tree/nodes/{nodeId}')
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
  public async updateCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Body() updateDto: UpdateCompanyTreeNodeDto
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to update CompanyTreeNode[%s]', nodeId);
    const updateCompanyTreeNode = await service.updateCompanyTreeNode(nodeId, companyId, updateDto);
    this.logger.info('CompanyTreeNode[%s] updated successfully!', nodeId);
    return { data: updateCompanyTreeNode };
  }

  /**
   * Unliks an employee from an existing CompanyTreeNode
   * @param nodeId CompanyTreeNode ID
   * @param companyId CompanyId
   * @returns Updated CompanyTreeNode
   */
  @Delete('/{companyId}/tree/nodes/{nodeId}/employee')
  public async unlinkEmployee(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to unlink Employee from CompanyTreeNode[%s]', nodeId);
    const unlinkEmployee = await service.unlinkEmployee(nodeId, companyId);
    this.logger.info('Employee unlinked from CompanyTreeNode[%s] updated successfully!', nodeId);
    return { data: unlinkEmployee };
  }

  
  /**
   * Remove an existing CompanyTreeNode
   * @param nodeId CompanyTreeNode ID
   * @param companyId companyId
   * @param query request query parameter successorParentId
   * @returns nothing
   */
  @Delete('/{companyId}/tree/nodes/{nodeId}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.GRIEVANCE_TYPE_NOT_FOUND,
    message: 'CompanyTreeNode does not exist',
    details: [],
  })
  public async deleteCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Queries() query: DeleteCompanyTreeNodeQueryDto
  ): Promise<void> {
    this.logger.debug('Received request to delete CompanyTreeNode[%s]', nodeId);
    await service.deleteNode(nodeId, companyId, query);
    this.logger.debug('CompanyTreeNode[%s] deleted successfully', nodeId);
  }

  /**
   * Checks if an Employee is a supervisor
   * @returns list of Supervisees and meta info
   */
  @Get('/{companyId}/tree/nodes/employees/supervisees')
  public async checkIfSupervisor(
    @Path('companyId') companyId: number,
    @Request() req: Express.Request,
    @Queries() query: CheckIfSupervisorDto
  ): Promise<ApiSuccessResponse<Employee[]>> {
    this.logger.debug(
      'Received request to check if Employee[%s] is supervisor', req.user?.employeeId
    );
    const reimbursementRequest = await service.checkIfSupervisor(companyId, req.user!, query);
    return { 
      data: reimbursementRequest,
      meta: { hasSupervisees: reimbursementRequest.length === 0 ? false : true }
    };
  }
}