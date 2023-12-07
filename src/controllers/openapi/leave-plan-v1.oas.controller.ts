import { LeavePlan } from '@prisma/client';
import {
  Body,
  Get,
  Patch,
  Path,
  Post,
  Queries,
  Response,
  Route,
  Request,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  CreateLeavePlanDto,
  QueryLeavePlanDto,
  UpdateLeavePlanDto,
} from '../../domain/dto/leave-plan.dto';
import * as LeavePlanService from '../../services/leave-plan.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('leave-plans')
@Route('/api/v1/leave-plans')
@Security('api_key')
export class LeavePlanV1Controller {
  private readonly logger = rootLogger.child({ context: LeavePlanV1Controller.name, });

  /**
   * Create a leave plan
   *
   * @param createData Request body
   * @returns API response
   */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addLeavePlan(
    @Body() createData: CreateLeavePlanDto
  ): Promise<ApiSuccessResponse<LeavePlan>> {
    this.logger.debug('Received request to add LeavePlan', { data: createData, });
    const leavePlan = await LeavePlanService.addLeavePlan(createData);
    return { data: leavePlan };
  }

  /**
   * Get a list of leave plan matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns List of matching leave plans
   */
  @Get()
  public async getLeavePlans(
    @Queries() query: QueryLeavePlanDto
  ): Promise<ApiSuccessResponse<LeavePlan[]>> {
    this.logger.debug('Received request to get LeavePlan(s) matching query', { query });
    const { data, pagination } = await LeavePlanService.getLeavePlans(query);
    this.logger.info('Returning %d LeavePlan(s) that matched the query', data.length);
    return { data, pagination };
  }

  /**
   * Get a leavePlan by ID
   * @param id leavePlan ID
   * @returns leavePlan
   */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: 'NOT_FOUND',
    message: 'LeavePlan does not exist',
    details: [],
  })
  public async getLeavePlan(
    @Path('id') id: number
  ): Promise<ApiSuccessResponse<LeavePlan>> {
    this.logger.debug('Received request to get leavePlan[%s]', id);
    const leavePlan = await LeavePlanService.getLeavePlan(id);
    return { data: leavePlan };
  }

  /**
   * Change the details of an existing leavePlan
   * @param id leavePlan ID
   * @param body Request body with leavePlan to update to
   * @returns Updated leavePlan
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
  public async updateLeavePlan(
    @Path('id') id: number,
    @Body() updateDto: UpdateLeavePlanDto,
    @Request() req: Express.Request
  ): Promise<ApiSuccessResponse<LeavePlan>> {
    this.logger.debug('Received request to update LeavePlan[%s]', id);
    const updateLeavePlan = await LeavePlanService.updateLeavePlan(id, updateDto, req.user!);
    this.logger.info('LeavePlan[%s] updated successfully!', id);
    return { data: updateLeavePlan };
  }

  /**
   * Remove an existing LeavePlan
   * @param id leavePlan ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.LEAVE_PLAN_NOT_FOUND,
    message: 'LeavePlan does not exist',
    details: [],
  })
  public async deleteLeavePlan(
    @Path('id') id: number
  ): Promise<void> {
    this.logger.debug('Received request to delete LeavePlan[%s]', id);
    await LeavePlanService.deleteLeavePlan(id);
    this.logger.debug('LeavePlan[%s] deleted successfully', id);
  }

}
