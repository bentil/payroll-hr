export default {
  contextPath: process.env.CONTEXT_PATH || '',
  appName: process.env.APP_NAME,
  port: parseInt(process.env.PORT || '3000', 10),
  loggerTimestampFormat: process.env.LOGGER_TIMESTAMP_FORMAT,
  dbUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL,
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '14'),
  convertActiveCurrenciesOnly: process.env.CONVERT_ACTIVE_CURRENCIES_ONLY === 'true',
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
  },
  topics: {
    getCountryById: process.env.TOPIC_API_GET_COUNTRY_BY_ID,
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

  cron: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
    manualStatementRequestSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
    periodicStatementRequestSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
    sendPeriodicStatementRequestSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
  },
  dates: {
    gracePeriodReminderLimit: (process.env.GRACE_PERIOD_REMINDER_LIMIT || 1) as number,
    invoicePaymentGracePeriodInDays: (process.env.INVOICE_PAYMENT_GRACE_PERIOD_IN_DAYS ||
      5) as number,
    invoicePaymentNotifyPeriodInDays: (process.env.INVOICE_PAYMENT_NOTIFY_PERIOD_IN_DAYS ||
      5) as number,
  },
  statementRequestBatchSize: (process.env.STATEMENT_REQUEST_BATCH_SIZE || 1000) as number,
};
