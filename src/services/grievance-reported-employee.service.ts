import { 
  AddGrievanceReportedEmployeeDto, 
  ReportedEmployeesDto 
} from '../domain/dto/grievance-reported-employee.dto';
import * as grievanceReportRepository from '../repositories/grievance-report.repository';
import * as reportedEmployeesRepo from '../repositories/grievance-reported-employee.repository';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { 
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { errors } from '../utils/constants';

//const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'GrievanceReport' });

export async function addReportedEmployeesToReport(
  id: number,
  addData: AddGrievanceReportedEmployeeDto
): Promise<ReportedEmployeesDto[]> {
  const grievanceReport = await grievanceReportRepository.findOne({ id });
  if (!grievanceReport) {
    logger.warn('GrievanceReport[%s] to udate does not exist', id);
    throw new NotFoundError({
      name: errors.GRIEVANCE_REPORT_NOT_FOUND,
      message: 'Grievance report to update does not exisit'
    });
  }
  const reportedEmployeesList = helpers.
    generateMultiGrievanceReportedEmployeesRecords(addData.reportedEmployeeIds, id);
  let newReportedEmployees: ReportedEmployeesDto[];
  try {
    newReportedEmployees = 
      await reportedEmployeesRepo.addGrievanceReportedEmployee(reportedEmployeesList, true);
    logger.info('Reported employee with grievance Report Id[%s] added successfully!', id);
  } catch (err) {
    logger.error('Adding reported employees failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  
  return newReportedEmployees;
}

export async function deleteReportedEmployee(
  reportId: number, reportedEmployeeId: number
): Promise<void> {
  console.log('reporotId -> ', reportId, 'reported employee ->', reportedEmployeeId);
  const reportedEmployee = await reportedEmployeesRepo.findReportedEmployee(
    { reportId_reportedEmployeeId: { reportId, reportedEmployeeId } });
  if (!reportedEmployee) {
    logger.warn(
      'ReportedEmployee[%s] for Report[%s] to delete does not exist', reportedEmployeeId, reportId
    );
    throw new NotFoundError({
      name: errors.EMPLOYEE_NOT_FOUND,
      message: 'ReportedEmployee to delete does not exisit'
    });
  }

  logger.debug(
    'Deleting ReportedEmployee[%s] for Report[%s] from database...', reportedEmployeeId, reportId
  );
  try {
    await reportedEmployeesRepo.deleteReportedEmployee(
      { reportId_reportedEmployeeId: { reportId, reportedEmployeeId } }
    );
    logger.info(
      'ReportedEmployee[%s] for Report[%s] successfully deleted', reportedEmployeeId, reportId
    );
  } catch (err) {
    logger.error(
      'Deleting ReportedEmployee[%] for Report[%s] failed', reportedEmployeeId, reportId
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}