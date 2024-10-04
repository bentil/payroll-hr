import tracer from 'cls-rtracer';
import express, { Application } from 'express';
import { PrismaService } from './components/db.component';
import { KafkaService } from './components/kafka.component';
import config from './config';
import MainConsumer from './consumers/main.consumer';
import morganMiddleware from './middleware/http-logger';
import { appErrorHandler } from './middleware/error-handler.middleware';
import appRouter from './routes';
import { rootLogger } from './utils/logger';

const logger = rootLogger.child({ context: 'App' });

export default async function startApp(
  port: string | number | undefined = config.port
): Promise<void> {
  const app: Application = express();
  const kafkaService = KafkaService.getInstance();
  const prismaService = PrismaService.getInstance();

  app.use(morganMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(tracer.expressMiddleware());

  logger.debug('Mounting application on context path [%s]', config.contextPath);
  app.use(config.contextPath, appRouter);

  //Error handling
  app.use(appErrorHandler);

  try {
    logger.debug('Starting services...');
    await prismaService.connect();
    logger.info('Database (Prisma) service ready!');
    await kafkaService.start();
    logger.info('kafka Service started successfully!');
    await MainConsumer.getInstance().startConsuming();
    logger.info('Main Consumer ready to start consuming!');
  } catch (err) {
    console.error('Failed to start some service(s)', err);
    process.exit(1);
  }

  const server = app.listen(config.port, async () => {
    logger.info(`App started successfully at http://**:${port}/`);
  });

  // Clean up and shutdown on these signals
  ['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
      console.log(`${signal} signal received. Closing server and cleaning up...`);
      await kafkaService.close();
      await prismaService.close();
      server.close(() => console.log('App stopped successfully!'));
    });
  });
}
