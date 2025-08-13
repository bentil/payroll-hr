import {
  Get,
  Path,
  Queries,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { ApiSuccessResponse } from '../../domain/api-responses';
import {
  DisciplinaryActionsReportResponse,
  QueryDisciplinaryActionReportDto,
} from '../../domain/dto/disciplinary-action.dto';
import * as service from '../../services/disciplinary-action.service';
import { rootLogger } from '../../utils/logger';

@Tags('disciplinary-actions-report')
@Route('/api/v1/payroll-companies/{companyId}/disciplinary-actions/reports')
@Security('api_key')
export class DisciplinaryActionsReportV1Controller {
  private readonly logger = rootLogger.child({ 
    context: DisciplinaryActionsReportV1Controller.name
  });


  /**
   * Get report on DisciplinaryActions in company matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns Report on DisciplinaryActions
   */
  @Get()
  public async getDisciplinaryActionsReport(
    @Path('companyId') companyId: number,
    @Queries() query: QueryDisciplinaryActionReportDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<DisciplinaryActionsReportResponse[]>> {
    this.logger.debug(
      'Received request to get report on DisciplinaryAction(s) matching query', { query }
    );
    const data = await service.getDisciplinaryActionsReport(companyId, query, req.user!);
    this.logger.info('Returning DisciplinaryAction(s) that matched the query');
    return { data };
  }

  /**
   * Get report on DisciplinaryActions for employee matching query
   *
   * @param query Request query parameters, including pagination and ordering details
   * @returns Report on DisciplinaryActions against an employee
   */
  @Get('/employees/{employeeId}')
  public async getDisciplinaryActionsForEmployeeReport(
    @Path('companyId') companyId: number,
    @Path('employeeId') employeeId: number,
    @Queries() query: QueryDisciplinaryActionReportDto,
    @Request() req: Express.Request,
  ): Promise<ApiSuccessResponse<DisciplinaryActionsReportResponse[]>> {
    this.logger.debug(
      'Received request to get report on DisciplinaryAction(s) matching query', { query }
    );
    const data = await service.getDisciplinaryActionsForEmployeeReport(
      companyId, employeeId, query, req.user!
    );
    this.logger.info('Returning DisciplinaryAction(s) that matched the query');
    return { data };
  }

}
