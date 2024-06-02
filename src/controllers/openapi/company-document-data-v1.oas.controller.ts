import { CompanyDocumentType } from '@prisma/client';
import {
  Body,
  Delete,
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
  CreateCompanyDocumentTypeDto,
  QueryCompanyDocumentTypeDto,
  SearchCompanyDocumentTypeDto,
  UpdateCompanyDocumentTypeDto
} from '../../domain/dto/company-document-type.dto';
import * as service from '../../services/company-document-data.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('company-document-types')
@Route('/api/v1/company-document-types')
@Security('api_key')
export class CompanyDocumentTypeV1Controller {
  private readonly logger = rootLogger.child({ context: CompanyDocumentTypeV1Controller.name, });

  /**
   * Create a companyDocumentType
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addCompanyDocumentType(
    @Body() createData: CreateCompanyDocumentTypeDto
  ): Promise<ApiSuccessResponse<CompanyDocumentType>> {
    this.logger.debug('Received request to add CompanyDocumentType', { data: createData, });
    const companyDocumentType = await service.addCompanyDocumentType(createData);
    return { data: companyDocumentType };
  }

  /**
   * Get a list of companyDocumentType matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching CompanyDocumentType
   */
  @Get()
  public async getCompanyDocumentTypes(
    @Queries() query: QueryCompanyDocumentTypeDto
  ): Promise<ApiSuccessResponse<CompanyDocumentType[]>> {
    this.logger.debug('Received request to get CompanyDocumentType(s) matching query', { query });
    const { data, pagination } = await service.getCompanyDocumentTypes(query);
    this.logger.info('Returning %d CompanyDocumentType(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a companyDocumentType by ID
   * @param id companyDocumentType ID
   * @returns companyDocumentType
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'Company document type does not exist',
    details: [],
  })
  public async getCompanyDocumentType(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<CompanyDocumentType>> {
    this.logger.debug('Received request to get CompanyDocumentType[%s]', id);
    const companyDocumentType = await service.getCompanyDocumentType(id);
    return { data: companyDocumentType };
  }

  /**
   * Change the details of an existing companyDocumentType
   * @param id companyDocumentType ID
   * @param body Request body with companyDocumentType to update to
   * @returns Updated companyDocumentType
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
  public async updateCompanyDocumentType(
    @Path('id') id: number,
    @Body() updateDto: UpdateCompanyDocumentTypeDto
  ): Promise<ApiSuccessResponse<CompanyDocumentType>> {
    this.logger.debug('Received request to update CompanyDocumentType[%s]', id);
    const updatedCompanyDocumentType = await service.updateCompanyDocumentType(id, updateDto);
    this.logger.info('CompanyDocumentType[%s] updated successfully!', id);
    return { data: updatedCompanyDocumentType };
  }

  /**
   * Search a companyDocumentType by name and description
   * 
   * @param searchParam search parameters including name and description
   * @returns companyDocumentType that match search
   */
  @Get('search')
  public async searchCompanyDocumentType(
    @Queries() searchParam: SearchCompanyDocumentTypeDto,
  ): Promise<ApiSuccessResponse<CompanyDocumentType[]>> {
    this.logger.info(
      'Received request to get CompanyDocumentType(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await service.searchCompanyDocumentType(searchParam);
    this.logger.info('Returning %d CompanyDocumentType(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing companyDocumentType
   * @param id companyDocumentType ID
   * @returns nothing
   */
  @Delete('{id}')
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.COMPANY_CURRENCY_NOT_FOUND,
    message: 'Company document type does not exist',
    details: [],
  })
  public async deleteCompanyDocumentType(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete CompanyDocumentType[%s]', id);
    await service.deleteCompanyDocumentType(id);
    this.logger.debug('CompanyDocumentType[%s] deleted successfully', id);
  }

}