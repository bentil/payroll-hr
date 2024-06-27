export const errors = {
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  ANNOUNCE_NOT_FOUND: 'ANNOUNCEMENT_NOT_FOUND',
  ANNOUNCE_RESOURCE_NOT_FOUND: 'ANNOUNCEMENT_RESOURCE_NOT_FOUND',
  BILLING_TYPE_NOT_FOUND: 'BILLING_TYPE_NOT_FOUND',
  COMPANY_CURRENCY_NOT_FOUND: 'COMPANY_CURRENCY_NOT_FOUND',
  COMPANY_DOCUMENT_TYPE_NOT_FOUND: 'COMPANY_DOCUMENT_TYPE_NOT_FOUND',
  COMPANY_LEVEL_NOT_FOUND: 'COMPANY_LEVEL_NOT_FOUND',
  COMPANY_TREE_NODE_NOT_FOUND: 'COMPANY_TREE_NODE_NOT_FOUND',
  COMPANY_TREE_NOT_FOUND: 'COMPANY_TREE_NOT_FOUND',
  COUNTRY_NOT_ACTIVE: 'COUNTRY_NOT_ACTIVE',
  COUNTRY_NOT_FOUND: 'COUNTRY_NOT_FOUND',
  CURRENCY_NOT_FOUND: 'CURRENCY_NOT_FOUND',
  CURRENCY_NOT_ACTIVE: 'CURRENCY_NOT_ACTIVE',
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  DISCIPLINARY_ACTION_TYPE_NOT_FOUND: 'DISCIPLINARY_ACTION_TYPE_NOT_FOUND',
  DISCIPLINARY_ACTION_NOT_FOUND: 'DISCIPLINARY_ACTION_NOT_FOUND',
  DOCUMENT_TYPE_NOT_FOUND: 'DOCUMENT_TYPE_NOT_FOUND',
  EMPLOYEE_DOCUMENT_NOT_FOUND: 'EMPLOYEE_DOCUMENT_NOT_FOUND',
  EMPLOYEE_NOT_ACTIVE: 'EMPLOYEE_NOT_ACTIVE',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  EXCHANGE_RATE_NOT_ACTIVE: 'EXCHANGE_RATE_NOT_ACTIVE',
  EXCHANGE_RATE_NOT_FOUND: 'EXCHANGE_RATE_NOT_FOUND',
  EMPLOYEE_WORK_TIME_NOT_FOUND: 'EMPLOYEE_WORK_TIME_NOT_FOUND',
  EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND: 'EMPLOYEE_OVERTIME_ENTRY_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  GRADE_LEVEL_NOT_FOUND: 'GRADE_LEVEL_NOT_FOUND',
  GRIEVANCE_REPORT_NOT_FOUND: 'GRIEVANCE_REPORT_NOT_FOUND',
  GRIEVANCE_TYPE_NOT_FOUND: 'GRIEVANCE_TYPE_NOT_FOUND',
  INPUT_ERROR: 'INPUT_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  JOB_TITLE_NOT_FOUND: 'JOB_TITLE_NOT_FOUND',
  LEAVE_PACKAGE_NOT_FOUND: 'LEAVE_PACKAGE_NOT_FOUND',
  LEAVE_PLAN_NOT_FOUND: 'LEAVE_PLAN_NOT_FOUND',
  LEAVE_REQUEST_NOT_FOUND: 'LEAVE_REQUEST_NOT_FOUND',
  LEAVE_QUOTA_EXCEEDED: 'LEAVE_QUOTA_EXCEEDED',
  NEGATIVE_RATE_NOT_ALLOWED: 'NEGATIVE_RATE_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  ORGANIZATION_NOT_ACTIVE: 'ORGANIZATION_NOT_ACTIVE',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORGANIZATION_PAYMENT_METHOD_ALREADY_EXISTS: 'ORGANIZATION_PAYMENT_METHOD_ALREADY_EXISTS',
  ORGANIZATION_CONFIG_NOT_FOUND: 'ORGANIZATION_CONFIG_NOT_FOUND',
  OVERTIME_NOT_FOUND: 'OVERTIME_NOT_FOUND',
  OVERTIME_PAYMENT_TIER_NOT_FOUND: 'OVERTIME_PAYMENT_TIER_NOT_FOUND',
  PAYMENT_INSTITUTION_NOT_ACTIVE: 'PAYMENT_INSTITUTION_NOT_ACTIVE',
  PAYMENT_INSTITUTION_NOT_FOUND: 'PAYMENT_INSTITUTION_NOT_FOUND',
  PAYMENT_CHANNEL_NOT_ACTIVE: 'PAYMENT_CHANNEL_NOT_ACTIVE',
  PAYMENT_CHANNEL_NOT_FOUND: 'PAYMENT_CHANNEL_NOT_FOUND',
  PAYROLL_COMPANY_NOT_ACTIVE: 'PAYROLL_COMPANY_NOT_ACTIVE',
  PAYROLL_COMPANY_NOT_FOUND: 'PAYROLL_COMPANY_NOT_FOUND',
  PAY_PERIOD_NOT_FOUND: 'PAY_PERIOD_NOT_FOUD',
  PROMOTION_NOT_ACTIVE: 'PROMOTION_NOT_ACTIVE',
  PROMOTION_NOT_FOUND: 'PROMOTION_NOT_FOUND',
  REIMBURSEMENT_REQUEST_NOT_FOUND: 'REIMBURSEMENT_REQUEST_NOT_FOUND',
  REQUIRED_DOCUMENT_MISSING: 'REQUIRED_DOCUMENT_MISSING',
  REQUIREMENT_NOT_MET: 'REQUIREMENT_NOT_MET',
  REQUEST_VALIDATION_FAILED: 'REQUEST_VALIDATION_FAILED',
  RECORD_IN_USE: 'RECORD_IN_USE',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  SERVICE_UNIMPLEMENTED: 'SERVICE_UNIMPLEMENTED',
  SUBSCRIPTION_BILLING_NOT_ACTIVE: 'SUBSCRIPTION BILLING NOT ACTIVE',
  SUBSCRIPTION_BILLING_NOT_FOUND: 'SUBSCRIPTION BILLING NOT FOUND',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_TIER_NOT_ACTIVE: 'SUBSCRIPTION_TIER_NOT_ACTIVE',
  SUBSCRIPTION_TIER_NOT_FOUND: 'SUBSCRIPTION_TIER_NOT_FOUND',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  NO_OUTSTANDING_BALANCE: 'NO OUTSTANDING BALANCE',
  INVOICE_ALREADY_CANCELLED: 'INVOICE ALREADY CANCELLED',
  INVOICE_ALREADY_PAID: 'INVOICE ALREADY PAID',
  NO_DEBIT_ON_INVOICE: 'NO EXISTING DEBIT ON INVOICE',
  TRANSACTION_NOT_FOUND: 'TRANSACTION NOT FOUND',
  REVERSAL_EXISTS: 'TRANSACTION ALREADY REVERSED',
  INVALID_TRANSACTION_TYPE: 'INVALID TRANSACTION TYPE',
  STATEMENT_REQUEST_NOT_FOUND: 'STATEMENT REQUEST NOT FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
};

export const mailMessages = {
  invoicePendingMessage: `Dear {{ORGANIZATION_NAME}},\n\n
  This is a friendly reminder that your payment for invoice {{INVOICE_ID}} is still pending. 
  Please submit your payment as soon as possible.\n\nThank you,\nYour Organization`,
};
