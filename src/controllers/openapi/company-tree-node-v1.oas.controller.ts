import { CompanyTreeNode } from '@prisma/client';
import {
  Body,
  Get,
  Patch,
  Path,
  Post,
  Response,
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
  CompanyTreeNodeDto,
  CreateCompanyTreeNodeDto, 
  UpdateCompanyTreeNodeDto 
} from '../../domain/dto/company-tree-node.dto';

@Tags('company-tree-nodes')
@Route('/api/v1/payroll-company')
@Security('api_key')
export class CompanyTreeNodeV1Controller {
  private readonly logger = rootLogger.child({ context: CompanyTreeNodeV1Controller.name, });

  /**
   * Create a company tree node
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
   * Get a Company tree 
   *
   * @param id companyId,
   * @returns Get matching Company tree
   */
  @Get('/{id}/tree')
  public async getCompanyTree(
    @Path() id: number
  ): Promise<ApiSuccessResponse<CompanyTreeNodeDto[]>> {
    this.logger.debug('Received request to get CompanyTree for company[%s] matching query', id);
    const companyTree = await service.getCompanyTree(id);
    this.logger.info('Returning CompanyTree for company[%s]', id);
    return { data: companyTree };
  }

  /**
   * Get a companyTreeNode by ID
   * @param companyId companyID
   * @param nodeId  CompanyTreeNodeId
   * @returns companyTreeNode
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
   * Change the details of an existing companyTreeNode
   * @param nodeId companyTreeNode ID
   * @param companyId companyId
   * @param body Request body with companyTreeNode to update to
   * @returns Updated companyTreeNode
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
}