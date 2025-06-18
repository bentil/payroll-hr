import { DisciplinaryAction } from '@prisma/client';
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
  CreateDisciplinaryActionDto,
  QueryDisciplinaryActionDto,
  SearchDisciplinaryActionDto,
  UpdateDisciplinaryActionDto,
} from '../../domain/dto/disciplinary-action.dto';
import * as service from '../../services/disciplinary-action.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('disciplinary-actions')
@Route('/api/v1/disciplinary-actions')
@Security('api_key')
export class DisciplinaryActionV1Controller {
  private readonly logger = rootLogger.child({ context: DisciplinaryActionV1Controller.name, });

  /**
   * Create a DisciplinaryAction
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addDisciplinaryAction(
    @Body() createData: CreateDisciplinaryActionDto
  ): Promise<ApiSuccessResponse<DisciplinaryAction>> {
    this.logger.debug('Received request to add DisciplinaryAction', { data: createData, });
    const disciplinaryAction = await service.addDisciplinaryAction(createData);
    return { data: disciplinaryAction };
  }

  /**
   * Get a list of DisciplinaryAction(s) matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching DisciplinaryAction(s)
   */
  @Get()
  public async getDisciplinaryActions(
    @Queries() query: QueryDisciplinaryActionDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<DisciplinaryAction[]>> {
    this.logger.debug(
      'Received request to get DisciplinaryAction(s) matching query', { query }
    );
    const { data, pagination } = await service.getDisciplinaryActions(query, req.user!);
    this.logger.info('Returning %d DisciplinaryAction(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a disciplinaryAction by ID
   * @param id disciplinaryAction ID
   * @returns disciplinaryAction
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'DisciplinaryAction does not exist',
    details: [],
  })
  public async getDisciplinaryAction(
    @Path('id') id: number,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<DisciplinaryAction>> {
    this.logger.debug('Received request to get disciplinaryAction[%s]', id);
    const disciplinaryAction = await service.getDisciplinaryAction(id, req.user!);
    return { data: disciplinaryAction };
  }

  /**
   * Change the details of an existing disciplinaryAction
   * @param id disciplinaryAction ID
   * @param body Request body with disciplinaryAction to update to
   * @returns Updated disciplinaryAction
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
  public async updateDisciplinaryAction(
    @Path('id') id: number,
    @Body() updateDto: UpdateDisciplinaryActionDto
  ): Promise<ApiSuccessResponse<DisciplinaryAction>> {
    this.logger.debug('Received request to update DisciplinaryAction[%s]', id);
    const updateDisciplinaryAction = await service.updateDisciplinaryAction(id, updateDto);
    this.logger.info('DisciplinaryAction[%s] updated successfully!', id);
    return { data: updateDisciplinaryAction };
  }

  /**
   * Search a disciplinaryAction by actionNumber and notes
   * 
   * @param searchParam search parameters including actionNumber and notes
   * @returns disciplinaryAction(s) that match search
   */
  @Get('search')
  public async searchDisciplinaryActions(
    @Queries() searchParam: SearchDisciplinaryActionDto,  @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<DisciplinaryAction[]>> {
    this.logger.debug(
      'Received request to get DisciplinaryAction(s) matching search query', { searchParam }
    );   
    const { data, pagination } = 
      await service.searchDisciplinaryActions(searchParam, req.user!);
    this.logger.info(
      'Returning %d DisciplinaryAction(s) that matched search query', data.length
    );
    return { data, pagination };
  }

  /**
   * Remove an existing disciplinaryAction
   * @param id disciplinaryAction ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.DISCIPLINARY_ACTION_NOT_FOUND,
    message: 'DisciplinaryAction does not exist',
    details: [],
  })
  public async deleteDisciplinaryAction(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete DisciplinaryAction[%s]', id);
    await service.deleteDisciplinaryAction(id);
    this.logger.debug('DisciplinaryAction[%s] deleted successfully', id);
  }

}
