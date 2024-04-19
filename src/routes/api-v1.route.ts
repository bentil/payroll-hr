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
  INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA,
  QUERY_APPLICABLE_LEAVE_TYPE_SCHEMA
} from '../domain/request-schema/leave-type.schema';
import {
  CREATE_LEAVE_PLAN_SCHEMA,
  UPDATE_LEAVE_PLAN_SCHEMA,
  QUERY_LEAVE_PLAN_SCHEMA
} from '../domain/request-schema/leave-plan.schema';
import {
  CREATE_LEAVE_REQUEST_SCHEMA,
  UPDATE_LEAVE_REQUEST_SCHEMA,
  QUERY_LEAVE_REQUEST_SCHEMA,
  CREATE_LEAVE_RESPONSE_SCHEMA,
  ADJUST_DAYS_SCHEMA,
} from '../domain/request-schema/leave-request.schema';
import {
  CHECK_IF_SUPERVISEE_SCHEMA,
  CREATE_COMPANY_TREE_NODE_SCHEMA,
  DELETE_COMPANY_NODE_SCHEMA,
  UPDATE_COMPANY_TREE_NODE_SCHEMA,
} from '../domain/request-schema/company-tree-node.schema';
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
import * as leavePlanV1Controller from '../controllers/leave-plan-v1.api.controller';
import * as leaveReqV1Controller from '../controllers/leave-request-v1.api.controller';
import * as summaryV1Controller from '../controllers/employee-leave-type-summary-v1.api.controller';
import * as treeNodeV1Controller from '../controllers/company-tree-node-v1.api.controller';
import * as reimbReqV1Controller from '../controllers/reimbursement-request-v1.api.controller';
import { 
  authenticateClient,
  authenticatePlatformUser, 
  authenticateUser 
} from '../middleware/auth.middleware';
import { 
  COMPLETE_REIMBURSEMENT_REQUEST_SCHEMA,
  CREATE_REIMBURSEMENT_REQUEST_SCHEMA, 
  CREATE_REIMBURSEMENT_RESPONSE_SCHEMA, 
  QUERY_REIMBURSEMENT_REQUEST_SCHEMA, 
  REIMBURSEMENT_REQUEST_UPDATES_SCHEMA, 
  SEARCH_REIMBURSEMENT_REQUEST_SCHEMA, 
  UPDATE_REIMBURSEMENT_REQUEST_SCHEMA 
} from '../domain/request-schema/reimbursement-request.schema';

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
  authenticateUser(),
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
  authenticateUser(),
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
  authenticateUser(),
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
  '/leave-packages/:id',
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
  authenticatePlatformUser(),
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
  '/leave-types/applicable',
  validateRequestQuery(QUERY_APPLICABLE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.listApplicableLeaveTypes
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
  authenticatePlatformUser(),
  leaveTypeV1Controller.deleteLeaveType
);

// ### LEAVE PLAN ROUTES

router.post(
  '/leave-plans',
  authenticateUser(),
  validateRequestBody(CREATE_LEAVE_PLAN_SCHEMA),
  leavePlanV1Controller.addNewLeavePlan
);

router.patch(
  '/leave-plans/:id',
  authenticateUser(),
  validateRequestBody(UPDATE_LEAVE_PLAN_SCHEMA),
  leavePlanV1Controller.updateLeavePlan
);
router.get(
  '/leave-plans',
  validateRequestQuery(QUERY_LEAVE_PLAN_SCHEMA),
  leavePlanV1Controller.getLeavePlans
);

router.get(
  '/leave-plans/:id',
  leavePlanV1Controller.getLeavePlan
);

router.delete(
  '/leave-plans/:id',
  leavePlanV1Controller.deleteLeavePlan
);

// ### LEAVE REQUEST ROUTES
router.post(
  '/leave-requests',
  authenticateUser(),
  validateRequestBody(CREATE_LEAVE_REQUEST_SCHEMA),
  leaveReqV1Controller.addNewLeaveRequest
);

router.patch(
  '/leave-requests/:id',
  authenticateUser(),
  validateRequestBody(UPDATE_LEAVE_REQUEST_SCHEMA),
  leaveReqV1Controller.updateLeaveRequest
);
router.get(
  '/leave-requests',
  authenticateUser(),
  validateRequestQuery(QUERY_LEAVE_REQUEST_SCHEMA),
  leaveReqV1Controller.getLeaveRequests
);

router.get(
  '/leave-requests/:id',
  authenticateUser(),
  leaveReqV1Controller.getLeaveRequest
);

router.delete(
  '/leave-requests/:id',
  leaveReqV1Controller.deleteLeaveRequest
);

router.post(
  '/leave-requests/:id/response',
  authenticateUser({ isEmployee: true }),
  validateRequestBody(CREATE_LEAVE_RESPONSE_SCHEMA),
  leaveReqV1Controller.addLeaveResponse
);

router.post(
  '/leave-requests/:id/cancel',
  authenticateUser(),
  leaveReqV1Controller.cancelLeaveRequest
);

router.patch(
  '/leave-requests/:id/number-of-days',
  authenticateUser(),
  validateRequestBody(ADJUST_DAYS_SCHEMA),
  leaveReqV1Controller.adjustDays
);

// ### Employee Leave Type summary 
router.post(
  '/employees/:employeeId/leave-types/:leaveTypeId/summary',
  authenticateUser(),
  summaryV1Controller.getSummary
);

// ### Company Tree Node 
router.post(
  '/payroll-company/:id/tree/nodes',
  authenticateUser(),
  validateRequestBody(CREATE_COMPANY_TREE_NODE_SCHEMA),
  treeNodeV1Controller.addNewCompanyTreeNode
);

router.get(
  '/payroll-company/:id/tree',
  authenticateUser(),
  treeNodeV1Controller.getCompanyTree
);

router.get(
  '/payroll-company/:companyId/tree/nodes/:nodeId',
  authenticateUser(),
  treeNodeV1Controller.getCompanyTreeNode
);

router.patch(
  '/payroll-company/:companyId/tree/nodes/:nodeId',
  authenticateUser(),
  validateRequestBody(UPDATE_COMPANY_TREE_NODE_SCHEMA),
  treeNodeV1Controller.updateCompanyTreeNode
);

router.delete(
  '/payroll-company/:companyId/tree/nodes/:nodeId/employee',
  authenticateUser(),
  treeNodeV1Controller.unlinkEmployee
);

router.delete(
  '/payroll-company/:companyId/tree/nodes/:nodeId',
  authenticateUser(),
  validateRequestQuery(DELETE_COMPANY_NODE_SCHEMA),
  treeNodeV1Controller.deleteCompanyTreeNode
);

router.get(
  '/payroll-company/:companyId/tree/nodes/employees/supervisees',
  authenticateUser(),
  validateRequestQuery(CHECK_IF_SUPERVISEE_SCHEMA),
  treeNodeV1Controller.checkIfSupervisor
);

// ### REIMBURSEMENT REQUEST ROUTES
router.post(
  '/reimbursement-requests',
  authenticateUser(),
  validateRequestBody(CREATE_REIMBURSEMENT_REQUEST_SCHEMA),
  reimbReqV1Controller.addNewReimbursementRequest
);

router.patch(
  '/reimbursement-requests/:id',
  authenticateUser(),
  validateRequestBody(UPDATE_REIMBURSEMENT_REQUEST_SCHEMA),
  reimbReqV1Controller.updateReimbursementRequest
);
router.get(
  '/reimbursement-requests',
  authenticateUser(),
  validateRequestQuery(QUERY_REIMBURSEMENT_REQUEST_SCHEMA),
  reimbReqV1Controller.getReimbursementRequests
);

router.get(
  '/reimbursement-requests/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_REIMBURSEMENT_REQUEST_SCHEMA),
  reimbReqV1Controller.searchReimbursementRequest
);

router.get(
  '/reimbursement-requests/:id',
  authenticateUser(),
  reimbReqV1Controller.getReimbursementRequest
);

router.post(
  '/reimbursement-requests/:id/response',
  authenticateUser({ isEmployee: true }),
  validateRequestBody(CREATE_REIMBURSEMENT_RESPONSE_SCHEMA),
  reimbReqV1Controller.addResponse
);

router.post(
  '/reimbursement-requests/:id/updates',
  authenticateUser(),
  validateRequestBody(REIMBURSEMENT_REQUEST_UPDATES_SCHEMA),
  reimbReqV1Controller.postUpdate
);

router.post(
  '/reimbursement-requests/:id/completion',
  authenticateUser({ isEmployee: true }),
  validateRequestBody(COMPLETE_REIMBURSEMENT_REQUEST_SCHEMA),
  reimbReqV1Controller.completeRequest
);

export default router;
