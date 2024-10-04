import { GrievanceType } from '@prisma/client';
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
  CreateGrievanceTypeDto,
  QueryGrievanceTypeDto,
  SearchGrievanceTypeDto,
  UpdateGrievanceTypeDto,
} from '../../domain/dto/grievance-type.dto';
import * as grievanceTypeService from '../../services/grievance-type.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('grievance-types')
@Route('/api/v1/grievance-types')
@Security('api_key')
export class GrievanceTypeV1Controller {
  private readonly logger = rootLogger.child({ context: GrievanceTypeV1Controller.name, });

  /**
   * Create a GrievanceType
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addGrievanceType(
    @Body() createData: CreateGrievanceTypeDto
  ): Promise<ApiSuccessResponse<GrievanceType>> {
    this.logger.debug('Received request to add GrievanceType', { data: createData, });
    const grievanceType = await grievanceTypeService.addGrievanceType(createData);
    return { data: grievanceType };
  }

  /**
   * Get a list of GrievanceType(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching GrievanceType(s)
   */
  @Get()
  public async getGrievanceTypes(
    @Queries() query: QueryGrievanceTypeDto
  ): Promise<ApiSuccessResponse<GrievanceType[]>> {
    this.logger.debug('Received request to get GrievanceType(s) matching query', { query });
    const { data, pagination } = await grievanceTypeService.getGrievanceTypes(query);
    this.logger.info('Returning %d GrievanceType(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a GrievanceType by ID
   * @param id GrievanceType ID
   * @returns GrievanceType
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'GrievanceType does not exist',
    details: [],
  })
  public async getGrievanceType(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<GrievanceType>> {
    this.logger.debug('Received request to get grievanceType[%s]', id);
    const grievanceType = await grievanceTypeService.getGrievanceType(id);
    return { data: grievanceType };
  }

  /**
   * Change the details of an existing GrievanceType
   * @param id GrievanceType ID
   * @param body Request body with details to update to
   * @returns Updated GrievanceType
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
  public async updateGrievanceType(
    @Path('id') id: number,
    @Body() updateDto: UpdateGrievanceTypeDto
  ): Promise<ApiSuccessResponse<GrievanceType>> {
    this.logger.debug('Received request to update GrievanceType[%s]', id);
    const updateGrievanceType = await grievanceTypeService.updateGrievanceType(id, updateDto);
    this.logger.info('GrievanceType[%s] updated successfully!', id);
    return { data: updateGrievanceType };
  }

  /**
   * Search for GrievanceType(s) by name, code and description
   * 
   * @param searchParam search parameters including name, code and description
   * @returns GrievanceType(s) that match search
   */
  @Get('search')
  public async searchGrievanceTypes(
    @Queries() searchParam: SearchGrievanceTypeDto,
  ): Promise<ApiSuccessResponse<GrievanceType[]>> {
    this.logger.debug(
      'Received request to get GrievanceType(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await grievanceTypeService.searchGrievanceTypes(searchParam);
    this.logger.info('Returning %d GrievanceType(s) that matched search query', data.length);
    return { data, pagination };
  }

  /**
   * Remove an existing GrievanceType
   * @param id GrievanceType ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.GRIEVANCE_TYPE_NOT_FOUND,
    message: 'GrievanceType does not exist',
    details: [],
  })
  public async deleteGrievanceType(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete GrievanceType[%s]', id);
    await grievanceTypeService.deleteGrievanceType(id);
    this.logger.debug('GrievanceType[%s] deleted successfully', id);
  }

}
