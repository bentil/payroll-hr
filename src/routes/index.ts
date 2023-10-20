import { /* Request, Response,*/ Router } from 'express';
// import swaggerUi from 'swagger-ui-express';

import v1Router from './api-v1.route';

const appRouter = Router();

appRouter.use('/api/v1', v1Router);

// OpenAPI documentation
// appRouter.use('/docs', swaggerUi.serve, async (_req: Request, res: Response) => {
//   return res.send(swaggerUi.generateHTML(await import('../../dist/swagger.json')));
// });

export default appRouter;
