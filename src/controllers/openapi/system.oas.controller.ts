import {
  Get,
  Route,
  Tags,
} from 'tsoa';
import { rootLogger } from '../../utils/logger';
import path from 'path';

@Tags('system')
@Route('/')
export class SystemController {
  private readonly logger = rootLogger.child({ context: SystemController.name });

  /**
     * Serves leave request upload template file
     * @returns 
     */
  @Get('/templates/uploads/leave_requests.xlsx')
  public serveLeaveRequestTemplate() {
    this.logger.debug('Received request to serve LeaveRequestTemplate');
    const rel = path.join(__dirname, '../../../templates/uploads/leave_requests.xlsx');
    return rel;
  }

  /**
     * Serves employee work time template file
     * @returns 
     */
  @Get('/templates/uploads/employee_work_times.xlsx')
  public serveEmployeeWorkTimeTemplate() {
    this.logger.debug('Received request to serve EmployeeWorkTimeTemplate');
    const rel = path.join(__dirname, '../../../templates/uploads/employee_work_times.xlsx');
    return rel;
  }

}