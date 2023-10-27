import { GrievanceReportedEmployee } from '@prisma/client';
import {
  Body,
  Delete,
  Path,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import {
  AddGrievanceReportedEmployeeDto,
} from '../../domain/dto/grievance-reported-employee.dto';
import * as reportedEmpService from '../../services/grievance-reported-employee.service';
import { rootLogger } from '../../utils/logger';
import { errors } from '../../utils/constants';

@Tags('grievance-reports')
@Route('/api/v1/grievance-reports')
@Security('api_key')
export class ReportedEmployeeV1Controller {
  private readonly logger = rootLogger.child({ context: ReportedEmployeeV1Controller.name, });

  /**
   * Create a grievance type
   *
   * @param id reportedEmployee ID
   * @param createData Request body
   * @returns API response
   */
  @Post('{reportId}/reported-employees')
  @SuccessResponse(201, 'Created')
  public async addGrievanceType(
    @Body() createData: AddGrievanceReportedEmployeeDto, @Path('reportId') id: number
  ): Promise<ApiSuccessResponse<GrievanceReportedEmployee[]>> {
    this.logger.debug('Received request to add GrievanceType', { data: createData, });
    const grievanceType = await reportedEmpService.addReportedEmployeesToReport(id, createData);
    return { data: grievanceType };
  }
  /**
   * Remove an existing grievanceType
   * @param id grievanceType ID
   * @returns nothing
   */
  @SuccessResponse(204)
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.GRIEVANCE_TYPE_NOT_FOUND,
    message: 'GrievanceType does not exist',
    details: [],
  })
  @Delete('{reportId}/reported-employees/{employeeId}')
  public async deleteGrievanceType(
    @Path('reportId') reportId: number, @Path('employeeId') employeeId: number
  ): Promise<void> {
    this.logger.debug(
      'Received request to delete Employee[%s] from Report[%s]',
      employeeId, reportId
    );
    await reportedEmpService.deleteReportedEmployee(reportId, employeeId);
    this.logger.debug('Employee[%s] successfully deleted from Report[%s]', employeeId, reportId);
  }

}
