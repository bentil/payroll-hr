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
import {
  CREATE_DISCIPLINARY_ACTION_TYPE_SCHEMA,
  QUERY_DISCIPLINARY_ACTION_TYPE_SCHEMA,
  UPDATE_DISCIPLINARY_ACTION_TYPE_SCHEMA,
  SEARCH_DISCIPLINARY_ACTION_TYPE_SCHEMA
} from '../domain/request-schema/disciplinary-action-type.schema';
import {
  CREATE_DISCIPLINARY_ACTION_SCHEMA,
  QUERY_DISCIPLINARY_ACTION_SCHEMA,
  UPDATE_DISCIPLINARY_ACTION_SCHEMA,
  SEARCH_DISCIPLINARY_ACTION_SCHEMA
} from '../domain/request-schema/disciplinary-action.schema';
import {
  CREATE_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA,
  QUERY_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA
} from '../domain/request-schema/company-level-leave-package.schema';
import {
  CREATE_LEAVE_PACKAGE_SCHEMA,
  UPDATE_LEAVE_PACKAGE_SCHEMA,
  QUERY_LEAVE_PACKAGE_SCHEMA,
  SEARCH_LEAVE_PACKAGE_SCHEMA
} from '../domain/request-schema/leave-package.schema';
import {
  CREATE_LEAVE_TYPE_SCHEMA,
  UPDATE_LEAVE_TYPE_SCHEMA,
  QUERY_LEAVE_TYPE_SCHEMA,
  SEARCH_LEAVE_TYPE_SCHEMA,
  INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA
} from '../domain/request-schema/leave-type.schema';
import * as leaveTypeV1Controller from '../controllers/leave-type-v1.api';
import * as leavePackageV1Controller from '../controllers/leave-package-v1.api';
// eslint-disable-next-line max-len
import * as companyLevelLeavePackageV1Controller from '../controllers/company-level-leave-package-v1.api';
import * as grievanceTypeV1Controller from '../controllers/grievance-type-v1.api.controller';
import * as grievnceReportV1Controller from '../controllers/grievance-report-v1.api.controller';
// eslint-disable-next-line max-len
import * as reportedEmployeesV1Controller from '../controllers/grievance-reported-employee-v1.api.controller';
// eslint-disable-next-line max-len
import * as disciplinaryActionTypeV1Controller from '../controllers/disciplinary-action-type-v1.api.controller';
// eslint-disable-next-line max-len
import * as disciplinaryActionV1Controller from '../controllers/disciplinary-action-v1.api.controller';
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

// ### GRIEVANCE REPORTS ROUTES

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

// ### DISCIPLINARY ACTION TYPES ROUTES

router.post(
  '/disciplinary-action-types',
  validateRequestBody(CREATE_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.addNewDisciplinaryActionType
);

router.get(
  '/disciplinary-action-types',
  validateRequestQuery(QUERY_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.getDisciplinaryActionTypes
);

router.get(
  '/disciplinary-action-types/search',
  validateRequestQuery(SEARCH_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.searchDisciplinaryActionType
);

router.get(
  '/disciplinary-action-types/:id',
  disciplinaryActionTypeV1Controller.getDisciplinaryActionType
);

router.patch(
  '/disciplinary-action-types/:id',
  validateRequestBody(UPDATE_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.updateDisciplinaryActionType
);

router.delete(
  '/disciplinary-action-types/:id',
  disciplinaryActionTypeV1Controller.deleteDisciplinaryActionType
);

// ### DISCIPLINARY ACTION ROUTES

router.post(
  '/disciplinary-actions',
  validateRequestBody(CREATE_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.addNewDisciplinaryAction
);

router.get(
  '/disciplinary-actions',
  validateRequestQuery(QUERY_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.getDisciplinaryActions
);

router.get(
  '/disciplinary-actions/search',
  validateRequestQuery(SEARCH_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.searchDisciplinaryAction
);

router.get(
  '/disciplinary-actions/:id',
  disciplinaryActionV1Controller.getDisciplinaryAction
);

router.patch(
  '/disciplinary-actions/:id',
  validateRequestBody(UPDATE_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.updateDisciplinaryAction
);

router.delete(
  '/disciplinary-actions/:id',
  disciplinaryActionV1Controller.deleteDisciplinaryAction
);

// ### COMPANY LEVEL LEAVE PACKAGE ROUTES

router.post(
  '/company-level-leave-packages',
  validateRequestBody(CREATE_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA),
  companyLevelLeavePackageV1Controller.addCompanyLevelLeavePackage
);

router.get(
  '/company-level-leave-packages',
  validateRequestQuery(QUERY_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA),
  companyLevelLeavePackageV1Controller.listCompanyLevelLeavePackages
);

router.get(
  '/company-level-leave-packages/:id',
  companyLevelLeavePackageV1Controller.getCompanyLevelLeavePackageById
);

router.delete(
  '/company-level-leave-packages/:id',
  companyLevelLeavePackageV1Controller.deleteCompanyLevelLeavePackage
);

// ### LEAVE PACKAGE ROUTES

router.post(
  '/leave-packages',
  validateRequestBody(CREATE_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.addLeavePackage
);

router.patch(
  '/leave-packages/:id',
  validateRequestBody(UPDATE_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.updateLeavePackage
);
router.get(
  '/leave-packages',
  validateRequestQuery(QUERY_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.listLeavePackages
);

router.get(
  '/leave-packages/search',
  validateRequestQuery(SEARCH_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.searchLeavePackages
);

router.get(
  '/leave-packages/:id/',
  validateRequestQuery(INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA),
  leavePackageV1Controller.getLeavePackageById
);

router.delete(
  '/leave-packages/:id',
  leavePackageV1Controller.deleteLeavePackage
);

// ### LEAVE TYPES ROUTES

router.post(
  '/leave-types',
  validateRequestBody(CREATE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.addLeaveType
);

router.patch(
  '/leave-types/:id',
  validateRequestBody(UPDATE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.updateLeaveType
);
router.get(
  '/leave-types',
  validateRequestQuery(QUERY_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.listLeaveTypes
);

router.get(
  '/leave-types/search',
  validateRequestQuery(SEARCH_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.searchLeaveTypes
);

router.get(
  '/leave-types/:id',
  leaveTypeV1Controller.getLeaveTypeById
);

router.delete(
  '/leave-types/:id',
  leaveTypeV1Controller.deleteLeaveType
);

export default router;
