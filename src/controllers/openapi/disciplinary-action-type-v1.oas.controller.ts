import { DisciplinaryActionType } from '@prisma/client';
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
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  CreateDisciplinaryActionTypeDto,
  QueryDisciplinaryActionTypeDto,
  SearchDisciplinaryActionTypeDto,
  UpdateDisciplinaryActionTypeDto,
} from '../../domain/dto/disciplinary-action-type.dto';
import * as service from '../../services/disciplinary-action-type.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('disciplinary-action-types')
@Route('/api/v1/disciplinary-action-types')
@Security('api_key')
export class DisciplinaryActionTypeV1Controller {
  private readonly logger = rootLogger.child({ context: DisciplinaryActionTypeV1Controller.name, });

  /**
   * Create a disciplinary action type
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addDisciplinaryActionType(
    @Body() createData: CreateDisciplinaryActionTypeDto
  ): Promise<ApiSuccessResponse<DisciplinaryActionType>> {
    this.logger.debug('Received request to add DisciplinaryActionType', { data: createData, });
    const disciplinaryActionType = await service.addDisciplinaryActionType(createData);
    return { data: disciplinaryActionType };
  }

  /**
   * Get a list of disciplinary action type matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching Disciplinary action types
   */
  @Get()
  public async getDisciplinaryActionTypes(
    @Queries() query: QueryDisciplinaryActionTypeDto
  ): Promise<ApiSuccessResponse<DisciplinaryActionType[]>> {
    this.logger.debug(
      'Received request to get DisciplinaryActionType(s) matching query', { query }
    );
    const { data, pagination } = await service.getDisciplinaryActionTypes(query);
    this.logger.info('Returning %d DisciplinaryActionType(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a disciplinaryActionType by ID
   * @param id disciplinaryActionType ID
   * @returns disciplinaryActionType
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'DisciplinaryActionType does not exist',
    details: [],
  })
  public async getDisciplinaryActionType(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<DisciplinaryActionType>> {
    this.logger.debug('Received request to get disciplinaryActionType[%s]', id);
    const disciplinaryActionType = await service.getDisciplinaryActionType(id);
    return { data: disciplinaryActionType };
  }

  /**
   * Change the details of an existing disciplinaryActionType
   * @param id disciplinaryActionType ID
   * @param body Request body with disciplinaryActionType to update to
   * @returns Updated disciplinaryActionType
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
  public async updateDisciplinaryActionType(
    @Path('id') id: number,
    @Body() updateDto: UpdateDisciplinaryActionTypeDto
  ): Promise<ApiSuccessResponse<DisciplinaryActionType>> {
    this.logger.debug('Received request to update DisciplinaryActionType[%s]', id);
    const updateDisciplinaryActionType = await service.updateDisciplinaryActionType(id, updateDto);
    this.logger.info('DisciplinaryActionType[%s] updated successfully!', id);
    return { data: updateDisciplinaryActionType };
  }

  /**
   * Search a disciplinaryActionType by name and description
   * 
   * @param searchParam search parameters including name and description
   * @returns disciplinaryActionType that match search
   */
  @Get('search')
  public async searchDisciplinaryActionType(
    @Queries() searchParam: SearchDisciplinaryActionTypeDto,  @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<DisciplinaryActionType[]>> {
    this.logger.info(
      'Received request to get DisciplinaryActionType(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await service.searchDisciplinaryActionType(searchParam, req.user!);
    this.logger.info(
      'Returning %d DisciplinaryActionType(s) that matched search query', data.length
    );
    return { data, pagination };
  }

  /**
   * Remove an existing disciplinaryActionType
   * @param id disciplinaryActionType ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.DISCIPLINARY_ACTION_TYPE_NOT_FOUND,
    message: 'DisciplinaryActionType does not exist',
    details: [],
  })
  public async deleteDisciplinaryActionType(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete DisciplinaryActionType[%s]', id);
    await service.deleteDisciplinaryActionType(id);
    this.logger.debug('DisciplinaryActionType[%s] deleted successfully', id);
  }

}
