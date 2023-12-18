import {
  Get,
  Path,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { ApiSuccessResponse } from '../../domain/api-responses';
import { EmployeLeaveTypeSummary } from '../../domain/dto/leave-type.dto';
import * as leaveReqService from '../../services/leave-request.service';
import { rootLogger } from '../../utils/logger';

@Tags('employee-leave-type-summary')
@Route('/api/v1')
@Security('api_key')
export class EmployeeLeaveTypeSummaryV1Controller {
  private readonly logger = rootLogger.child({
    context: EmployeeLeaveTypeSummaryV1Controller.name, 
  });

  /**
   * Get Employee Leave Type summary
   * @returns Employee Leave Type summary
   */
  @Get('employees/{employeeId}/leave-types/{leaveTypeId}/summary')
  public async getSummary(
    @Path('employeeId') employeeId: number,
    @Path('leaveTypeId') leaveTypeId: number
  ): Promise<ApiSuccessResponse<EmployeLeaveTypeSummary>> {
    this.logger.debug(
      'Received request to get Employee[%s] LeaveType[%s] summary', employeeId, leaveTypeId
    );
    const summary = await leaveReqService.getEmployeeLeaveTypeSummary(employeeId, leaveTypeId);
    this.logger.info(
      'Employee[%s] LeaveType[%s] summary retrieved successfully!', employeeId, leaveTypeId
    );
    return { data: summary };
  }
}