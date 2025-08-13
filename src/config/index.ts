export default {
  contextPath: process.env.CONTEXT_PATH || '',
  appName: process.env.APP_NAME,
  port: parseInt(process.env.PORT || '3000', 10),
  loggerTimestampFormat: process.env.LOGGER_TIMESTAMP_FORMAT,
  dbUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL,
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '14'),
  convertActiveCurrenciesOnly: process.env.CONVERT_ACTIVE_CURRENCIES_ONLY === 'true',
  templates: {
    leaveRequestPath: process.env.LEAVE_REQUEST_TEMPLATE_PATH || '',
    leaveResponsePath: process.env.LEAVE_RESPONSE_TEMPLATE_PATH || '',
    reimbursementRequestPath: process.env.REIMBURSEMENT_REQUEST_TEMPLATE_PATH || '',
    reimbursementResponsePath: process.env.REIMBURSEMENT_RESPONSE_TEMPLATE_PATH || '',
    defaultPhotoUrl: process.env.DEFAULT_PHOTO_URL || ''
  },
  log: {
    level: process.env.LOG_LEVEL,
    rootDirectory: process.env.LOG_ROOT_DIRECTORY || './logs/',
    timestampFormat: process.env.LOG_TIMESTAMP_FORMAT,
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '14'),
  },
  pagination: {
    limit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20'),
  },
  kafka: {
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || '').split(','),
    clientId: process.env.KAFKA_CLIENT_ID,
    connectTimeout: process.env.KAFKA_CONNECT_TIMEOUT
      ? parseInt(process.env.KAFKA_CONNECT_TIMEOUT)
      : undefined,
    groupId: process.env.KAFKA_GROUP_ID || '',
    useSsl: process.env.KAFKA_USE_SSL
      ? process.env.KAFKA_USE_SSL === 'true' : undefined,
    sslConfigPaths: {
      ca: process.env.KAFKA_SSL_CA_PATH,
      key: process.env.KAFKA_SSL_KEY_PATH,
      cert: process.env.KAFKA_SSL_CERT_PATH,
    }
  },
  topics: {
    getCountryById: process.env.TOPIC_API_GET_COUNTRY_BY_ID,
    notifications: process.env.TOPIC_NOTIFICATIONS,
  },
  actionUrls: {
    leaveRequest: process.env.LEAVE_REQUEST_URL || '',
    reimbursementRequest: process.env.REIMBURSEMENT_REQUEST_URL || '',
  },
  rpc: {
    serverAddress: process.env.RPC_SERVER_ADDRESS || 'localhost:50000',
    serviceUrls: {
      country: process.env.RPC_COUNTRY_SERVICE_URL,
      billing: process.env.RPC_BILLING_SERVICE_URL,
      document: process.env.RPC_DOCUMENT_SERVICE_URL,
      user: process.env.RPC_USER_SERVICE_URL,
      organization: process.env.RPC_ORGANIZATION_SERVICE_URL,
    },
  },
  notifications: {
    emailSender: process.env.NOTIFICATION_EMAIL_SENDER || 'notifications@akatua.lucidarray.dev',
    leaveRequestSubject: process.env.LEAVE_REQUEST_SUBJECT || 'Akatua Leave Request',
    // eslint-disable-next-line max-len
    reimbursementRequestSubject: process.env.REIMBURSEMENT_REQUEST_SUBJECT || 'Akatua Reimbursement Request',
  },
  messages: {
    serverError: process.env.SERVER_ERROR_MESSAGE || 'An error occurred while processing request',
    permissionError: process.env.PERMISSION_ERROR_MESSAGE || 'Permissions check failed',
  },
  statementRequestBatchSize: (process.env.STATEMENT_REQUEST_BATCH_SIZE || 1000) as number,
  reportNumberLength: parseInt(process.env.SMS_OTP_LENGTH || '6', 10),
  grievanceReportAlphaLength: parseInt(process.env.GRIEVANCE_REPORT_ALPHA_LENGTH || '4', 10),
  grievanceReportDigitsLength: parseInt(process.env.GRIEVANCE_REPORT_DIGITS_LENGTH || '2', 10),
  disciplinaryActionAlphaLength: parseInt(process.env.DISCIPLINARY_ACTION_ALPHA_LENGTH || '4', 10),
  disciplinaryActionDigitsLength: parseInt(
    process.env.DISCIPLINARY_ACTION_DIGITS_LENGTH || '2', 10
  ),
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'https://storage.akatua.com',
    bucketName: process.env.S3_BUCKET_NAME || 'hr-reports',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || 'EUROPE-1',
  }
};
