import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import config from '../config';
import tracer from 'cls-rtracer';

const { combine, json, simple, splat, timestamp } = winston.format;

const httpLogFilter = winston.format((info, _) => {
  return info.level === 'http' ? info : false;
});

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: config.log?.level || 'info',
  defaultMeta: { service: config.appName, get requestId() { return tracer.id(); } },
  format: combine(splat(), timestamp({ format: config.log?.timestampFormat }), json()),
  transports: [
    new DailyRotateFile({
      filename: path.resolve(config.log.rootDirectory, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: `${config.log.retentionDays}d`,
    }),
    new DailyRotateFile({
      level: 'http',
      filename: path.resolve(config.log.rootDirectory, 'access-%DATE%.log'),
      format: combine(httpLogFilter(), json()),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: `${config.log.retentionDays}d`,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({ format: simple() }),
    new DailyRotateFile({
      filename: path.resolve(config.log.rootDirectory, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: `${config.log.retentionDays}d`,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: simple() }),
    new DailyRotateFile({
      filename: path.resolve(config.log.rootDirectory, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: `${config.log.retentionDays}d`,
    }),
  ],
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
