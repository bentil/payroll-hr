import { Router } from 'express';
import * as announcementV1Controller from '../controllers/announcement-v1.api.controller';
import * as compDocTypeV1Controller from '../controllers/company-document-type-v1.api.controller';
// eslint-disable-next-line max-len
import * as companyLevelLeavePackageV1Controller from '../controllers/company-level-leave-package-v1.api';
import * as treeNodeV1Controller from '../controllers/company-tree-node-v1.api.controller';
// eslint-disable-next-line max-len
import * as disciplinaryActionTypeV1Controller from '../controllers/disciplinary-action-type-v1.api.controller';
import * as employeeApproverV1Controller from '../controllers/employee-approver-v1.api.controller';
import * as employeeDocumentV1Controller from '../controllers/employee-document-v1.api.controller';
import * as summaryV1Controller from '../controllers/employee-leave-type-summary-v1.api.controller';
// eslint-disable-next-line max-len
import * as empOvertimeEntryV1Controller from '../controllers/employee-overtime-entry-v1.api.controller';
import * as employeeWorkTimeV1Controller from '../controllers/employee-work-time-v1.api.controller';
// eslint-disable-next-line max-len
import * as disciplinaryActionV1Controller from '../controllers/disciplinary-action-v1.api.controller';
import * as grievanceReportV1Controller from '../controllers/grievance-report-v1.api.controller';
// eslint-disable-next-line max-len
import * as reportedEmployeesV1Controller from '../controllers/grievance-reported-employee-v1.api.controller';
import * as grievanceTypeV1Controller from '../controllers/grievance-type-v1.api.controller';
import * as leavePackageV1Controller from '../controllers/leave-package-v1.api';
import * as leavePlanV1Controller from '../controllers/leave-plan-v1.api.controller';
import * as leaveReqV1Controller from '../controllers/leave-request-v1.api.controller';
import * as leaveTypeV1Controller from '../controllers/leave-type-v1.api';
import * as reimbReqV1Controller from '../controllers/reimbursement-request-v1.api.controller';
import * as uploadV1Controller from '../controllers/upload-v1.api.controller';
// eslint-disable-next-line max-len
import * as disciplinaryActionReportV1Controller from '../controllers/disciplinary-action-report-v1.api.controller';
import * as leaveReportV1controller from '../controllers/leave-report-v1.api.controller';
import * as companyApproverV1Controller from '../controllers/company-approver-v1.api.controller';
import {
  CREATE_ANNOUNCEMENT_SCHEMA, 
  QUERY_EMPLOYEE_ANNOUNCEMENT_SCHEMA, 
  QUERY_ANNOUNCEMENT_SCHEMA, 
  SEARCH_ANNOUNCEMENT_SCHEMA, 
  UPDATE_ANNOUNCEMENT_SCHEMA,
  UPDATE_ANNOUNCEMENT_RESOURCE_SCHEMA
} from '../domain/request-schema/announcement.schema';
import {
  CREATE_COMPANY_DOCUMENT_TYPE_SCHEMA,
  QUERY_COMPANY_DOCUMENT_TYPE_SCHEMA,
  SEARCH_COMPANY_DOCUMENT_TYPE_SCHEMA,
  UPDATE_COMPANY_DOCUMENT_TYPE_SCHEMA,
} from '../domain/request-schema/company-document-type.schema';
import {
  CREATE_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA,
  QUERY_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA
} from '../domain/request-schema/company-level-leave-package.schema';
import {
  CHECK_IF_SUPERVISEE_SCHEMA,
  CREATE_COMPANY_TREE_NODE_SCHEMA,
  DELETE_COMPANY_NODE_SCHEMA,
  UPDATE_COMPANY_TREE_NODE_SCHEMA,
} from '../domain/request-schema/company-tree-node.schema';
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
  SEARCH_DISCIPLINARY_ACTION_SCHEMA,
  QUERY_DISCIPLINARY_ACTIONS_REPORT_SCHEMA
} from '../domain/request-schema/disciplinary-action.schema';
import {
  CREATE_EMPLOYEE_APPROVER_SCHEMA, 
  GET_ONE_EMPLOYEE_APPROVER_SCHEMA, 
  QUERY_EMPLOYEE_APPROVER_SCHEMA, 
  UPDATE_EMPLOYEE_APPROVER_SCHEMA 
} from '../domain/request-schema/employee-approver.schema';
import {
  CREATE_EMPLOYEE_DOCUMENT_SCHEMA,
  QUERY_EMPLOYEE_DOCUMENT_SCHEMA,
  UPDATE_EMPLOYEE_DOCUMENT_SCHEMA,
} from '../domain/request-schema/employee-document.schema';
import {
  CREATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA,
  QUERY_EMPLOYEE_OVERTIME_ENTRY_SCHEMA, 
  UPDATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA 
} from '../domain/request-schema/employee-overtime-entry.schema';
import {
  CREATE_EMPLOYEE_WORK_TIME_SCHEMA, 
  QUERY_EMPLOYEE_WORK_TIME_SCHEMA, 
  UPDATE_EMPLOYEE_WORK_TIME_SCHEMA
} from '../domain/request-schema/employee-work-time.schema';
import {
  CREATE_GRIEVANCE_REPORTED_EMPLOYEE_SCHEMA,
  CREATE_GRIEVANCE_REPORT_SCHEMA, 
  QUERY_GRIEVANCE_REPORT_SCHEMA, 
  SEARCH_GRIEVANCE_REPORT_SCHEMA,
  UPDATE_GRIEVANCE_REPORT_SCHEMA
} from '../domain/request-schema/grievance-report.schema';
import {
  CREATE_GRIEVANCE_TYPE_SCHEMA, 
  QUERY_GRIEVANCE_TYPE_SCHEMA, 
  SEARCH_GRIEVANCE_TYPE_SCHEMA,
  UPDATE_GRIEVANCE_TYPE_SCHEMA
} from '../domain/request-schema/grievance-type.schema';
import {
  CREATE_LEAVE_PACKAGE_SCHEMA,
  UPDATE_LEAVE_PACKAGE_SCHEMA,
  QUERY_LEAVE_PACKAGE_SCHEMA,
  SEARCH_LEAVE_PACKAGE_SCHEMA
} from '../domain/request-schema/leave-package.schema';
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
  CONVERT_LEAVE_PLAN_SCHEMA,
  FILTER_LEAVE_REQUEST_FOR_EXPORT_SCHEMA,
  QUERY_LEAVE_REQUEST_FOR_REPORT_SCHEMA,
} from '../domain/request-schema/leave-request.schema';
import {
  CREATE_LEAVE_TYPE_SCHEMA,
  UPDATE_LEAVE_TYPE_SCHEMA,
  QUERY_LEAVE_TYPE_SCHEMA,
  SEARCH_LEAVE_TYPE_SCHEMA,
  INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA,
  QUERY_APPLICABLE_LEAVE_TYPE_SCHEMA
} from '../domain/request-schema/leave-type.schema';
import {
  COMPLETE_REIMBURSEMENT_REQUEST_SCHEMA,
  CREATE_REIMBURSEMENT_REQUEST_SCHEMA, 
  CREATE_REIMBURSEMENT_RESPONSE_SCHEMA, 
  QUERY_REIMBURSEMENT_REQUEST_SCHEMA, 
  REIMBURSEMENT_REQUEST_UPDATES_SCHEMA, 
  SEARCH_REIMBURSEMENT_REQUEST_SCHEMA, 
  UPDATE_REIMBURSEMENT_REQUEST_SCHEMA 
} from '../domain/request-schema/reimbursement-request.schema';
import { UserCategory } from '../domain/user.domain';
import {
  authenticateClient,
  authenticatePlatformUser, 
  authenticateUser 
} from '../middleware/auth.middleware';
import {
  validateRequestBody,
  validateRequestQuery
} from '../middleware/request-validation.middleware';
import validate from '../middleware/upload.validation';
import {
  CREATE_COMPANY_APPROVER_SCHEMA, 
  QUERY_COMPANY_APPROVER_SCHEMA, 
  UPDATE_COMPANY_APPROVER_SCHEMA 
} from '../domain/request-schema/company-approver.schema';
import { 
  CREATE_ANNOUNCEMENT_READ_EVENT_SCHEMA, 
  QUERY_ANNOUNCEMENT_READ_EVENT_SUMMARY_SCHEMA
} from '../domain/request-schema/announcement-read-event.schema';

const router = Router();
router.use(authenticateClient);

// ### GRIEVANCE TYPE ROUTES

router.post(
  '/grievance-types',
  authenticateUser({ permissions: 'company_configs:conduct:write' }),
  validateRequestBody(CREATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.addNewGrievanceType
);

router.get(
  '/grievance-types',
  authenticateUser(),
  validateRequestQuery(QUERY_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.getGrievanceTypes
);

router.get(
  '/grievance-types/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.searchGrievanceTypes
);

router.get(
  '/grievance-types/:id',
  authenticateUser(),
  grievanceTypeV1Controller.getGrievanceType
);

router.patch(
  '/grievance-types/:id',
  authenticateUser({ permissions: 'company_configs:conduct:write' }),
  validateRequestBody(UPDATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.updateGrievanceType
);

router.delete(
  '/grievance-types/:id',
  authenticateUser({ permissions: 'company_configs:conduct:write' }),
  grievanceTypeV1Controller.deleteGrievanceType
);

// ### GRIEVANCE REPORTS ROUTES

router.post(
  '/grievance-reports',
  authenticateUser(),
  validateRequestBody(CREATE_GRIEVANCE_REPORT_SCHEMA),
  grievanceReportV1Controller.addNewGrievanceReport
);

router.get(
  '/grievance-reports',
  authenticateUser(),
  validateRequestQuery(QUERY_GRIEVANCE_REPORT_SCHEMA),
  grievanceReportV1Controller.getGrievanceReports
);

router.get(
  '/grievance-reports/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_GRIEVANCE_REPORT_SCHEMA),
  grievanceReportV1Controller.searchGrievanceReports
);

router.get(
  '/grievance-reports/:id',
  authenticateUser(),
  grievanceReportV1Controller.getGrievanceReport
);

router.patch(
  '/grievance-reports/:id',
  authenticateUser(),
  validateRequestBody(UPDATE_GRIEVANCE_REPORT_SCHEMA),
  grievanceReportV1Controller.updateGrievanceReport
);

router.delete(
  '/grievance-reports/:id',
  authenticateUser(),
  grievanceReportV1Controller.deleteGrievanceReport
);

// ### REPORTED EMPLOYEES ROUTES

router.post(
  '/grievance-reports/:reportId/reported-employees',
  authenticateUser(),
  validateRequestBody(CREATE_GRIEVANCE_REPORTED_EMPLOYEE_SCHEMA),
  reportedEmployeesV1Controller.addNewReportedEmployee
);

router.delete(
  '/grievance-reports/:reportId/reported-employees/:employeeId',
  authenticateUser(),
  reportedEmployeesV1Controller.deleteReportedEmployee
);

// ### DISCIPLINARY ACTION TYPES ROUTES

router.post(
  '/disciplinary-action-types',
  authenticateUser({ 
    category: [UserCategory.HR], 
    permissions: 'company_configs:conduct:write' 
  }),
  validateRequestBody(CREATE_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.addNewDisciplinaryActionType
);

router.get(
  '/disciplinary-action-types',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.getDisciplinaryActionTypes
);

router.get(
  '/disciplinary-action-types/search',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(SEARCH_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.searchDisciplinaryActionTypes
);

router.get(
  '/disciplinary-action-types/:id',
  authenticateUser({ isEmployee: true }),
  disciplinaryActionTypeV1Controller.getDisciplinaryActionType
);

router.patch(
  '/disciplinary-action-types/:id',
  authenticateUser({ 
    category: [UserCategory.HR], 
    permissions: 'company_configs:conduct:write' 
  }),
  validateRequestBody(UPDATE_DISCIPLINARY_ACTION_TYPE_SCHEMA),
  disciplinaryActionTypeV1Controller.updateDisciplinaryActionType
);

router.delete(
  '/disciplinary-action-types/:id',
  authenticateUser({
    category: [UserCategory.HR],
    permissions: 'company_configs:conduct:write'
  }),
  disciplinaryActionTypeV1Controller.deleteDisciplinaryActionType
);

// ### DISCIPLINARY ACTION ROUTES

router.post(
  '/disciplinary-actions',
  authenticateUser(),
  validateRequestBody(CREATE_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.addNewDisciplinaryAction
);

router.get(
  '/disciplinary-actions',
  authenticateUser(),
  validateRequestQuery(QUERY_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.getDisciplinaryActions
);

router.get(
  '/disciplinary-actions/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.searchDisciplinaryAction
);

router.get(
  '/disciplinary-actions/:id',
  authenticateUser(),
  disciplinaryActionV1Controller.getDisciplinaryAction
);

router.patch(
  '/disciplinary-actions/:id',
  authenticateUser(),
  validateRequestBody(UPDATE_DISCIPLINARY_ACTION_SCHEMA),
  disciplinaryActionV1Controller.updateDisciplinaryAction
);

router.delete(
  '/disciplinary-actions/:id',
  authenticateUser(),
  disciplinaryActionV1Controller.deleteDisciplinaryAction
);

// ### COMPANY LEVEL LEAVE PACKAGE ROUTES

router.post(
  '/company-level-leave-packages',
  authenticateUser({ permissions: 'company_configs:leave:write' }),
  validateRequestBody(CREATE_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA),
  companyLevelLeavePackageV1Controller.addCompanyLevelLeavePackage
);

router.get(
  '/company-level-leave-packages',
  authenticateUser(),
  validateRequestQuery(QUERY_COMPANY_LEVEL_LEAVE_PACKAGE_SCHEMA),
  companyLevelLeavePackageV1Controller.listCompanyLevelLeavePackages
);

router.get(
  '/company-level-leave-packages/:id',
  authenticateUser(),
  companyLevelLeavePackageV1Controller.getCompanyLevelLeavePackageById
);

router.delete(
  '/company-level-leave-packages/:id',
  authenticateUser({ permissions: 'company_configs:leave:write' }),
  companyLevelLeavePackageV1Controller.deleteCompanyLevelLeavePackage
);

// ### LEAVE PACKAGE ROUTES

router.post(
  '/leave-packages',
  authenticateUser({ permissions: 'company_configs:leave:write' }),
  validateRequestBody(CREATE_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.addLeavePackage
);

router.patch(
  '/leave-packages/:id',
  authenticateUser({ permissions: 'company_configs:leave:write' }),
  validateRequestBody(UPDATE_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.updateLeavePackage
);
router.get(
  '/leave-packages',
  authenticateUser(),
  validateRequestQuery(QUERY_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.listLeavePackages
);

router.get(
  '/leave-packages/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_LEAVE_PACKAGE_SCHEMA),
  leavePackageV1Controller.searchLeavePackages
);

router.get(
  '/leave-packages/:id',
  authenticateUser(),
  validateRequestQuery(INCLUDE_COMPANY_LEVELS_QUERY_SCHEMA),
  leavePackageV1Controller.getLeavePackageById
);

router.delete(
  '/leave-packages/:id',
  authenticateUser({ permissions: 'company_configs:leave:write' }),
  leavePackageV1Controller.deleteLeavePackage
);

// ### LEAVE TYPES ROUTES

router.post(
  '/leave-types',
  authenticatePlatformUser({ permissions: 'platform_configs:statutory:write' }),
  validateRequestBody(CREATE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.addLeaveType
);

router.patch(
  '/leave-types/:id',
  authenticatePlatformUser({ permissions: 'platform_configs:statutory:write' }),
  validateRequestBody(UPDATE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.updateLeaveType
);
router.get(
  '/leave-types',
  authenticateUser(),
  validateRequestQuery(QUERY_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.listLeaveTypes
);

router.get(
  '/leave-types/applicable',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_APPLICABLE_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.listApplicableLeaveTypes
);

router.get(
  '/leave-types/search',
  authenticateUser(),
  validateRequestQuery(SEARCH_LEAVE_TYPE_SCHEMA),
  leaveTypeV1Controller.searchLeaveTypes
);

router.get(
  '/leave-types/:id',
  authenticateUser(),
  leaveTypeV1Controller.getLeaveTypeById
);

router.delete(
  '/leave-types/:id',
  authenticatePlatformUser({ permissions: 'platform_configs:statutory:write' }),
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
  authenticateUser(),
  validateRequestQuery(QUERY_LEAVE_PLAN_SCHEMA),
  leavePlanV1Controller.getLeavePlans
);

router.get(
  '/leave-plans/:id',
  authenticateUser(),
  leavePlanV1Controller.getLeavePlan
);

router.delete(
  '/leave-plans/:id',
  authenticateUser(),
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
  authenticateUser(),
  leaveReqV1Controller.deleteLeaveRequest
);

router.post(
  '/leave-requests/:id/response',
  authenticateUser(),
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

router.post(
  '/leave-requests/convert-plan',
  authenticateUser(),
  validateRequestBody(CONVERT_LEAVE_PLAN_SCHEMA),
  leaveReqV1Controller.convertLeavePlan
);

// ### Employee Leave Type summary 
router.post(
  '/employees/:employeeId/leave-types/:leaveTypeId/summary',
  authenticateUser(),
  summaryV1Controller.getSummary
);

// ### Company Tree Node 
router.post(
  '/payroll-compan(y|ies)/:companyId/tree/nodes',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(CREATE_COMPANY_TREE_NODE_SCHEMA),
  treeNodeV1Controller.addNewCompanyTreeNode
);

router.get(
  '/payroll-compan(y|ies)/:companyId/tree',
  authenticateUser(),
  treeNodeV1Controller.getCompanyTree
);

router.get(
  '/payroll-compan(y|ies)/:companyId/tree/nodes/:nodeId',
  authenticateUser(),
  treeNodeV1Controller.getCompanyTreeNode
);

router.patch(
  '/payroll-compan(y|ies)/:companyId/tree/nodes/:nodeId',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(UPDATE_COMPANY_TREE_NODE_SCHEMA),
  treeNodeV1Controller.updateCompanyTreeNode
);

router.delete(
  '/payroll-compan(y|ies)/:companyId/tree/nodes/:nodeId/employee',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  treeNodeV1Controller.unlinkEmployee
);

router.delete(
  '/payroll-compan(y|ies)/:companyId/tree/nodes/:nodeId',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestQuery(DELETE_COMPANY_NODE_SCHEMA),
  treeNodeV1Controller.deleteCompanyTreeNode
);

router.get(
  '/payroll-compan(y|ies)/:companyId/tree/nodes/employees/supervisees',
  authenticateUser(),
  validateRequestQuery(CHECK_IF_SUPERVISEE_SCHEMA),
  treeNodeV1Controller.getSupervisionInfo
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
  reimbReqV1Controller.searchReimbursementRequests
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

router.delete(
  '/reimbursement-requests/:id',
  authenticateUser(),
  reimbReqV1Controller.deleteReimbursementRequest
);

// ### EMPLOYEE WORK TIME ROUTES

router.post(
  '/employee-work-times',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  validateRequestBody(CREATE_EMPLOYEE_WORK_TIME_SCHEMA),
  employeeWorkTimeV1Controller.addNewEmployeeWorkTime
);

router.patch(
  '/employee-work-times/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  validateRequestBody(UPDATE_EMPLOYEE_WORK_TIME_SCHEMA),
  employeeWorkTimeV1Controller.updateEmployeeWorkTime
);
router.get(
  '/employee-work-times',
  authenticateUser(),
  validateRequestQuery(QUERY_EMPLOYEE_WORK_TIME_SCHEMA),
  employeeWorkTimeV1Controller.getEmployeeWorkTimes
);

router.get(
  '/employee-work-times/:id',
  authenticateUser(),
  employeeWorkTimeV1Controller.getEmployeeWorkTime
);

router.delete(
  '/employee-work-times/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  employeeWorkTimeV1Controller.deleteEmployeeWorkTime
);

// ### EMPLOYEE OVERTIME ENTRY ROUTES

router.post(
  '/employee-overtime-entries',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  validateRequestBody(CREATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA),
  empOvertimeEntryV1Controller.addNewEmployeeOvertimeEntry
);

router.patch(
  '/employee-overtime-entries/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  validateRequestBody(UPDATE_EMPLOYEE_OVERTIME_ENTRY_SCHEMA),
  empOvertimeEntryV1Controller.updateEmployeeOvertimeEntry
);
router.get(
  '/employee-overtime-entries',
  authenticateUser(),
  validateRequestQuery(QUERY_EMPLOYEE_OVERTIME_ENTRY_SCHEMA),
  empOvertimeEntryV1Controller.getEmployeeOvertimeEntries
);

router.get(
  '/employee-overtime-entries/:id',
  authenticateUser(),
  empOvertimeEntryV1Controller.getEmployeeOvertimeEntry
);

router.delete(
  '/employee-overtime-entries/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'employees:time:write',
  }),
  empOvertimeEntryV1Controller.deleteEmployeeOvertimeEntry
);

// ### COMPANY DOCUMENT TYPE ROUTES

router.post(
  '/company-document-types',
  authenticateUser({ 
    category: [UserCategory.HR], 
    permissions: 'company_configs:information:write' 
  }),
  validateRequestBody(CREATE_COMPANY_DOCUMENT_TYPE_SCHEMA),
  compDocTypeV1Controller.addCompanyDocumentType
);

router.get(
  '/company-document-types',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_COMPANY_DOCUMENT_TYPE_SCHEMA),
  compDocTypeV1Controller.getCompanyDocumentTypes
);

router.get(
  '/company-document-types/search',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(SEARCH_COMPANY_DOCUMENT_TYPE_SCHEMA),
  compDocTypeV1Controller.searchCompanyDocumentTypes
);

router.get(
  '/company-document-types/:id',
  authenticateUser({ isEmployee: true }),
  compDocTypeV1Controller.getCompanyDocumentType
);

router.patch(
  '/company-document-types/:id',
  authenticateUser({ 
    category: [UserCategory.HR],
    permissions: 'company_configs:information:write'
  }),
  validateRequestBody(UPDATE_COMPANY_DOCUMENT_TYPE_SCHEMA),
  compDocTypeV1Controller.updateCompanyDocumentType
);

router.delete(
  '/company-document-types/:id',
  authenticateUser({ 
    category: [UserCategory.HR],
    permissions: 'company_configs:information:write'
  }),
  compDocTypeV1Controller.deleteCompanyDocumentType
);

// ### EMPLOYEE DOCUMENT ROUTES

router.post(
  '/employee-documents',
  authenticateUser({ category: [UserCategory.HR] }),
  validateRequestBody(CREATE_EMPLOYEE_DOCUMENT_SCHEMA),
  employeeDocumentV1Controller.addEmployeeDocument
);

router.get(
  '/employee-documents',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_EMPLOYEE_DOCUMENT_SCHEMA),
  employeeDocumentV1Controller.getEmployeeDocuments
);

router.get(
  '/employee-documents/:id',
  authenticateUser({ isEmployee: true }),
  employeeDocumentV1Controller.getEmployeeDocument
);

router.patch(
  '/employee-documents/:id',
  authenticateUser({ category: [UserCategory.HR] }),
  validateRequestBody(UPDATE_EMPLOYEE_DOCUMENT_SCHEMA),
  employeeDocumentV1Controller.updateEmployeeDocument
);

router.delete(
  '/employee-documents/:id',
  authenticateUser({ category: [UserCategory.HR] }),
  employeeDocumentV1Controller.deleteEmployeeDocument
);

// ### ANNOUNCEMENT ROUTES

router.post(
  '/announcements',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestBody(CREATE_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.addNewAnnouncement
);

router.get(
  '/announcements',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestQuery(QUERY_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.getAnnouncements
);

router.get(
  '/announcements/me',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_EMPLOYEE_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.getMyAnnouncements
);

router.get(
  '/announcements/search',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestQuery(SEARCH_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.searchAnnouncements
);

router.get(
  '/announcements/me/search',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(SEARCH_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.searchMyAnnouncements
);

router.get(
  '/announcements/:id',
  authenticateUser({ permissions: 'announcements:write' }),
  announcementV1Controller.getAnnouncement
);

router.patch(
  '/announcements/:id',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestBody(UPDATE_ANNOUNCEMENT_SCHEMA),
  announcementV1Controller.updateAnnouncement
);

router.patch(
  '/announcements/:announcementId/resources/:id',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestBody(UPDATE_ANNOUNCEMENT_RESOURCE_SCHEMA),
  announcementV1Controller.updateAnnouncementResource
);

router.delete(
  '/announcements/:id',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  announcementV1Controller.deleteAnnouncement
);

// ### EMPLOYEE APPROVER ROUTES

router.post(
  '/employees/:employeeId/approvers',
  authenticateUser({ 
    category: [UserCategory.HR], 
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(CREATE_EMPLOYEE_APPROVER_SCHEMA),
  employeeApproverV1Controller.addEmployeeApprover
);

router.get(
  '/employees/:employeeId/approvers',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(QUERY_EMPLOYEE_APPROVER_SCHEMA),
  employeeApproverV1Controller.getEmployeeApprovers
);

router.get(
  '/employees/:employeeId/approvers/:id',
  authenticateUser({ isEmployee: true }),
  validateRequestQuery(GET_ONE_EMPLOYEE_APPROVER_SCHEMA),
  employeeApproverV1Controller.getEmployeeApprover,
);

router.patch(
  '/employees/:employeeId/approvers/:id',
  authenticateUser({ 
    category: [UserCategory.HR],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(UPDATE_EMPLOYEE_APPROVER_SCHEMA),
  employeeApproverV1Controller.updateEmployeeApprover
);

router.delete(
  '/employees/:employeeId/approvers/:id',
  authenticateUser({ 
    category: [UserCategory.HR],
    permissions: 'company_configs:hierarchy:write'
  }),
  employeeApproverV1Controller.deleteEmployeeApprover
);

router.post(
  '/employees/:employeeId/approvers/preflight',
  authenticateUser({ 
    category: [UserCategory.HR],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(CREATE_EMPLOYEE_APPROVER_SCHEMA),
  employeeApproverV1Controller.employeeApproverPreflight
);

// UPLOAD ROUTES
router.post(
  '/payroll-companies/:companyId/uploads/leave-requests',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
    permissions: 'company_configs:write' 
  }),
  validate('leave_requests'),
  uploadV1Controller.uploadLeaveRequests
);

router.get(
  '/payroll-companies/:companyId/exports/leave-requests',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
    permissions: 'company_configs:read' 
  }),
  validateRequestQuery(FILTER_LEAVE_REQUEST_FOR_EXPORT_SCHEMA),
  uploadV1Controller.exportLeaveRequests
);

// ## DISCIPLINARY ACTION REPORT ROUTES
router.get(
  '/payroll-companies/:companyId/disciplinary-actions/reports',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
  }),
  validateRequestQuery(QUERY_DISCIPLINARY_ACTIONS_REPORT_SCHEMA),
  disciplinaryActionReportV1Controller.getDisciplinaryActionsReport
);

router.get(
  '/payroll-companies/:companyId/disciplinary-actions/reports/employees/:employeeId',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
  }),
  validateRequestQuery(QUERY_DISCIPLINARY_ACTIONS_REPORT_SCHEMA),
  disciplinaryActionReportV1Controller.getDisciplinaryActionsForEmployeeReport
);

// ### LEAVE RESPONSE  ROUTES
router.get(
  '/payroll-companies/:companyId/leave-requests/reports/leaves-taken',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
  }),
  validateRequestQuery(QUERY_LEAVE_REQUEST_FOR_REPORT_SCHEMA),
  leaveReportV1controller.getLeavesTaken
);

router.get(
  '/payroll-companies/:companyId/leave-requests/reports/leaves-taken/employees/:employeeId',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
  }),
  validateRequestQuery(QUERY_LEAVE_REQUEST_FOR_REPORT_SCHEMA),
  leaveReportV1controller.getEmployeeLeavesTaken
);

router.get(
  '/payroll-companies/:companyId/leave-requests/reports/leaves-balance',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
  }),
  leaveReportV1controller.getLeavesBalance
);

// ### COMPANY APPROVER ROUTES
router.post(
  '/payroll-companies/:companyId/approvers',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS], 
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(CREATE_COMPANY_APPROVER_SCHEMA),
  companyApproverV1Controller.addCompanyApprover
);

router.get(
  '/payroll-companies/:companyId/approvers',
  authenticateUser(),
  validateRequestQuery(QUERY_COMPANY_APPROVER_SCHEMA),
  companyApproverV1Controller.getCompanyApprovers
);

router.get(
  '/payroll-companies/:companyId/approvers/:id',
  authenticateUser(),
  companyApproverV1Controller.getCompanyApprover,
);

router.patch(
  '/payroll-companies/:companyId/approvers/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  validateRequestBody(UPDATE_COMPANY_APPROVER_SCHEMA),
  companyApproverV1Controller.updateCompanyApprover
);

router.delete(
  '/payroll-companies/:companyId/approvers/:id',
  authenticateUser({ 
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'company_configs:hierarchy:write'
  }),
  companyApproverV1Controller.deleteCompanyApprover
);

// ### ANNOUNCEMENT-READ-EVENT ROUTES

router.post(
  '/announcements/:id/read-events',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
    permissions: 'announcements:write'
  }),
  validateRequestBody(CREATE_ANNOUNCEMENT_READ_EVENT_SCHEMA),
  announcementV1Controller.addNewAnnouncementReadEvent
);

router.get(
  '/announcements/read-events/summary',
  authenticateUser({ category: [UserCategory.HR, UserCategory.OPERATIONS] }),
  validateRequestQuery(QUERY_ANNOUNCEMENT_READ_EVENT_SUMMARY_SCHEMA),
  announcementV1Controller.getAnnouncementReadEventSummaryList
);

router.get(
  '/announcements/:id/read-events/summary',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
  }),
  announcementV1Controller.getAnnouncementReadEventSummary
);

router.get(
  '/announcements/:id/read-events/details',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
  }),
  announcementV1Controller.getReadEventDetails
);

router.get(
  '/announcements/:id/read-events/details/pdf',
  authenticateUser({
    category: [UserCategory.HR, UserCategory.OPERATIONS],
  }),
  announcementV1Controller.getReadEventDetailsPdf
);

export default router;
