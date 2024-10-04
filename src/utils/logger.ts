import rTracer from 'cls-rtracer';
import { LogEntry, logLevel } from 'kafkajs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';

const { combine, json, simple, splat, timestamp } = winston.format;
const logRetention = (config.log.retentionDays > 0)
  ? `${config.log.retentionDays}d` : undefined;

const httpLogFilter = winston.format((info, _) => {
  return info.level === 'http' ? info : false;
});

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: config.log?.level || 'info',
  defaultMeta: {
    service: config.appName,
    get requestId() {
      return rTracer.id();
    }
  },
  format: combine(
    splat(),
    timestamp({ format: config.log?.timestampFormat }),
    json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: logRetention,
      createSymlink: true,
      symlinkName: 'app.log',
      dirname: path.resolve(config.log.rootDirectory),
    }),
    new DailyRotateFile({
      level: 'http',
      filename: 'access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: logRetention,
      createSymlink: true,
      symlinkName: 'access.log',
      format: combine(httpLogFilter(), json()), // only http logs
      dirname: path.resolve(config.log.rootDirectory),
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console({ format: simple() }),
    new DailyRotateFile({
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: logRetention,
      createSymlink: true,
      symlinkName: 'exceptions.log',
      dirname: path.resolve(config.log.rootDirectory),
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: simple() }),
    new DailyRotateFile({
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: logRetention,
      createSymlink: true,
      symlinkName: 'rejections.log',
      dirname: path.resolve(config.log.rootDirectory),
    })
  ]
};

export const rootLogger = winston.createLogger(winstonLoggerOptions);

// suppress all logs when running in 'test' environment
if (process.env.NODE_ENV === 'test') {
  rootLogger.silent = true;
}

// Log to console when not in production environment
if (process.env.NODE_ENV !== 'production') {
  rootLogger.add(new winston.transports.Console());
}

export function KafkaLogger(logger: any) {
  return function ({ namespace, level, label, log }: LogEntry) {
    let loggerMethod: string;

    switch (level) {
      case logLevel.WARN:
        loggerMethod = 'warn';
        break;
      case logLevel.INFO:
        loggerMethod = 'info';
        break;
      case logLevel.ERROR:
      case logLevel.NOTHING:
        loggerMethod = 'error';
        break;
      case logLevel.DEBUG:
      default:
        loggerMethod = 'debug';
    }

    const { message, ...others } = log;
    if (logger[loggerMethod]) {
      logger[loggerMethod](
        `${message}`,
        { meta: { ...others, label, namespace } }
      );
    }
  };
}
