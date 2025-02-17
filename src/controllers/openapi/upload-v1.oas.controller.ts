import { 
  Path, 
  Post,
  Request, 
  Route, 
  Security, 
  Tags, 
  UploadedFile 
} from 'tsoa';
import { rootLogger } from '../../utils/logger';
import * as leaveReqeustService from '../../services/leave-request.service';
import { UploadLeaveRequestResponse } from '../../domain/dto/leave-request.dto';

@Tags('upload')
@Route('/api/v1/payroll-companies/{companyId}/uploads')
@Security('api_key')
export class UploadV1Controller {
  private readonly logger = rootLogger.child({ context: UploadV1Controller.name });
  /**
     * Add new leaveRequests by uploading via template excel file
     *
     * @param companyId Company id
     * @param file File containing employee data
     * @param req Request object
     * @returns Employee
     */
    @Post('leave-requests')
  public async uploadLeaveRequests(
    @Path('companyId') companyId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: Express.Request
  ): Promise<UploadLeaveRequestResponse> {
    this.logger.debug('About to upload LeaveRequests for the company[%s]', companyId);
    return await leaveReqeustService.uploadLeaveRequests(companyId, file, req.user!);
  }
}