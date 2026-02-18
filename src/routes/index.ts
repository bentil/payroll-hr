import { NextFunction, Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import v1Router from './api-v1.route';
import { 
  serveEmployeeWorkTimeTemplate,
  serveLeaveRequestTemplate 
} from '../controllers/system.api';

const appRouter = Router();

appRouter.use('/api/v1', v1Router);

// OpenAPI documentation
if (process.env.NODE_ENV !== 'production') {
  appRouter.use(
    '/docs',
    swaggerUi.serve,
    async (_req: Request, res: Response) => {
      return res.send(
        swaggerUi.generateHTML(await import('../../dist/swagger.json'))
      );
    }
  );
} else {
  appRouter.use(
    '/docs',
    (_req: Request, res: Response, _next: NextFunction) => {
      res.status(404).send();
    }
  );
}

appRouter.get(
  '/templates/uploads/leave_requests.xlsx',
  serveLeaveRequestTemplate
);

appRouter.get(
  '/templates/uploads/employee_work_times.xlsx',
  serveEmployeeWorkTimeTemplate
);

export default appRouter;
