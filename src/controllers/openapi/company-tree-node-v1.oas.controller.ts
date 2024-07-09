import { CompanyTreeNode, Employee } from '@prisma/client';
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
  CompanyTreeNodeDto,
  CreateCompanyTreeNodeDto,
  DeleteCompanyTreeNodeQueryDto,
  SupervisorInfoQueryDto,
  UpdateCompanyTreeNodeDto,
} from '../../domain/dto/company-tree-node.dto';
import * as service from '../../services/company-tree-node.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';


@Tags('company-tree-nodes')
@Route('/api/v1/payroll-companies/{companyId}/tree')
@Security('api_key')
export class CompanyTreeNodeV1Controller {
  private readonly logger = rootLogger.child({
    context: CompanyTreeNodeV1Controller.name
  });

  /**
   * Add a Company tree node
   * 
   * @param companyId Company id
   * @param createData Request body
   * @param req Request object
   * @returns CompanyTreeNode
   */
  @Post('/nodes')
  @SuccessResponse(201, 'Created')
  public async addCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Body() createData: CreateCompanyTreeNodeDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug(
      'Received request to add CompanyTreeNode',
      { data: createData }
    );
    const companyTreeNode = await service.addCompanyTreeNode(
      companyId,
      createData,
      req.user!
    );
    this.logger.info('CompanyTreeNode added successfully!');
    return { data: companyTreeNode };
  }
  
  /**
   * Get company tree
   * 
   * @param companyId Company id
   * @param req Request object
   * @returns CompanyTree
   */
  @Get()
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.COMPANY_TREE_NOT_FOUND,
    message: 'Company tree does not exist',
    details: [],
  })
  public async getCompanyTree(
    @Path() companyId: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<CompanyTreeNodeDto>> {
    this.logger.debug('Received request to get Company[%s] Tree', companyId);
    const companyTree = await service.getCompanyTree(companyId, req.user!);
    this.logger.info('Returning Company[%s] Tree', companyId);
    return { data: companyTree };
  }
  
  /**
   * Get a company tree node
   * 
   * @param companyId Company id
   * @param nodeId Node id
   * @param req Request object
   * @returns CompanyTreeNode
   */
  @Get('/nodes/{nodeId}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.COMPANY_TREE_NODE_NOT_FOUND,
    message: 'Company tree node does not exist',
    details: [],
  })
  public async getCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to get CompanyTreeNode[%s]', nodeId);
    const companyTreeNode = await service.getCompanyTreeNode(
      nodeId,
      companyId,
      req.user!
    );
    this.logger.info('CompanyTreeNode[%s] retrieved', nodeId);
    return { data: companyTreeNode };
  }
  
  /**
   * Update details of a Company tree node
   * 
   * @param companyId Company id
   * @param nodeId Node id
   * @param updateDto Request body with details to update
   * @param req Request object
   * @returns Updated CompanyTreeNode
   */
  @Patch('/nodes/{nodeId}')
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
  public async updateCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Body() updateDto: UpdateCompanyTreeNodeDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug('Received request to update CompanyTreeNode[%s]', nodeId);
    const updateCompanyTreeNode = await service.updateCompanyTreeNode(
      nodeId,
      companyId,
      updateDto,
      req.user!
    );
    this.logger.info('CompanyTreeNode[%s] updated successfully!', nodeId);
    return { data: updateCompanyTreeNode };
  }

  /**
   * Unlink an employee from a Company tree node
   * 
   * @param companyId Company id
   * @param nodeId Node id
   * @param req Request object
   * @returns Updated CompanyTreeNode
   */
  @Delete('/nodes/{nodeId}/employee')
  public async unlinkEmployee(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<CompanyTreeNode>> {
    this.logger.debug(
      'Received request to unlink Employee from CompanyTreeNode[%s]',
      nodeId
    );
    const updatedCompanyTreeNode = await service.unlinkEmployee(
      nodeId,
      companyId,
      req.user!
    );
    this.logger.info(
      'Employee unlinked from CompanyTreeNode[%s] successfully!',
      nodeId
    );
    return { data: updatedCompanyTreeNode };
  }
  
  /**
   * Remove a Company tree node with option to specify successor
   * 
   * @param companyId Company id
   * @param nodeId Node id
   * @param query Query params
   * @param req Request object
   */
  @Delete('/nodes/{nodeId}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.COMPANY_TREE_NODE_NOT_FOUND,
    message: 'Company tree node does not exist',
    details: [],
  })
  public async deleteCompanyTreeNode(
    @Path('companyId') companyId: number,
    @Path('nodeId') nodeId: number,
    @Queries() query: DeleteCompanyTreeNodeQueryDto,
    @Request() req: Express.Request,
  ): Promise<void> {
    this.logger.debug('Received request to delete CompanyTreeNode[%s]', nodeId);
    await service.deleteNode(nodeId, companyId, query, req.user!);
    this.logger.info('CompanyTreeNode[%s] deleted successfully', nodeId);
  }
  
  /**
   * Return employees reports and indicator whether supervisor or not
   * 
   * @param companyId Company id
   * @param query Query params
   * @param req Request object
   * @returns List of Employees
   */
  @Get('/nodes/employees/supervisees')
  public async getSupervisionInfo(
    @Path('companyId') companyId: number,
    @Queries() query: SupervisorInfoQueryDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<Employee[]>> {
    this.logger.debug(
      'Received request to get Employee supervision info', query
    );
    const reportEmployees = await service.getReportEmployees(
      companyId,
      query,
      req.user!
    );
    this.logger.info('Employee supervision info retrieved');
    return { 
      data: reportEmployees,
      meta: { hasSupervisees: reportEmployees.length > 0 }
    };
  }
}