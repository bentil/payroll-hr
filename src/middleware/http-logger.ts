import { Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';

import { rootLogger } from '../utils/logger';

let morganMiddleware: RequestHandler;

if (process.env.NODE_ENV !== 'development') {
  morganMiddleware = morgan(
    (tokens, req: Request, res: Response) => {
      return JSON.stringify({
        remoteAddress: tokens['remote-addr'](req, res),
        romoteUser: tokens['remote-user'](req, res),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: Number.parseFloat(tokens.status(req, res) || '0'),
        contentLength: tokens.res(req, res, 'content-length'),
        responseTime: Number.parseFloat(tokens['response-time'](req, res) || '-1'),
      });
    },
    {
      stream: {
        write: (message) => rootLogger.http('HTTP request', JSON.parse(message)),
      },
    }
  );
} else {
  morganMiddleware = morgan('short');
}

export default morganMiddleware;
