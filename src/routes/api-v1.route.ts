import { Router } from 'express';
import { validateRequestBody, validateRequestQuery } from '../middleware/request-validations';
import { 
  CREATE_GRIEVANCE_TYPE_SCHEMA, 
  QUERY_GRIEVANCE_TYPE_SCHEMA, 
  SEARCH_GRIEVANCE_TYPE_SCHEMA,
  UPDATE_GRIEVANCE_TYPE_SCHEMA
} from '../domain/request-schema/grievance-type.schema';
import { 
  CREATE_GRIEVANCE_REPORTED_EMPLOYEE_SCHEMA,
  CREATE_GRIEVANCE_REPORT_SCHEMA, 
  QUERY_GRIEVANCE_REPORT_SCHEMA, 
  SEARCH_GRIEVANCE_REPORT_SCHEMA,
  UPDATE_GRIEVANCE_REPORT_SCHEMA
} from '../domain/request-schema/grievance-report.schema';
import * as grievanceTypeV1Controller from '../controllers/grievance-type-v1.api.controller';
import * as grievnceReportV1Controller from '../controllers/grievance-report-v1.api.controller';
// eslint-disable-next-line max-len
import * as reportedEmployeesV1Controller from '../controllers/grievance-reported-employee-v1.api.controller';
import { authenticateClient } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateClient);

// ### GRIEVANCE TYPE ROUTES

router.post(
  '/grievance-types',
  validateRequestBody(CREATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.addNewGrievanceType
);

router.get(
  '/grievance-types',
  validateRequestQuery(QUERY_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.getGrievanceTypes
);

router.get(
  '/grievance-types/search',
  validateRequestQuery(SEARCH_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.searchGrievanceTypes
);

router.get(
  '/grievance-types/:id',
  grievanceTypeV1Controller.getGrievanceType
);

router.patch(
  '/grievance-types/:id',
  validateRequestBody(UPDATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.updateGrievanceType
);

router.delete(
  '/grievance-types/:id',
  grievanceTypeV1Controller.deleteGrievanceType
);

// ### GRIEVANCE TYPE ROUTES

router.post(
  '/grievance-reports',
  validateRequestBody(CREATE_GRIEVANCE_REPORT_SCHEMA),
  grievnceReportV1Controller.addNewGrievanceReport
);

router.get(
  '/grievance-reports',
  validateRequestQuery(QUERY_GRIEVANCE_REPORT_SCHEMA),
  grievnceReportV1Controller.getGrievanceReports
);

router.get(
  '/grievance-reports/search',
  validateRequestQuery(SEARCH_GRIEVANCE_REPORT_SCHEMA),
  grievnceReportV1Controller.searchGrievanceReport
);

router.get(
  '/grievance-reports/:id',
  grievnceReportV1Controller.getGrievanceReport
);

router.patch(
  '/grievance-reports/:id',
  validateRequestBody(UPDATE_GRIEVANCE_REPORT_SCHEMA),
  grievnceReportV1Controller.updateGrievanceReport
);

router.delete(
  '/grievance-reports/:id',
  grievnceReportV1Controller.deleteGrievanceReport
);

// ### REPORTED EMPLOYEES ROUTES

router.post(
  '/grievance-reports/:reportId/reported-employees',
  validateRequestBody(CREATE_GRIEVANCE_REPORTED_EMPLOYEE_SCHEMA),
  reportedEmployeesV1Controller.addNewReportedEmployee
);

router.delete(
  '/grievance-reports/:reportId/reported-employees/:employeeId',
  reportedEmployeesV1Controller.deleteReportedEmployee
);

export default router;
