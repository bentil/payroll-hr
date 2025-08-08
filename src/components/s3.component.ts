import { S3Service } from '../services/S3Service';
import config from '../config';
import { rootLogger as logger } from '../utils/logger';

class S3Component {
  private static instance: S3Service | null = null;

  static getInstance(): S3Service {
    if (!S3Component.instance) {
      try {
        S3Component.instance = new S3Service(config.s3);
        logger.info('S3 component singleton initialized');
      } catch (error) {
        logger.error('Failed to initialize S3 component:', error);
        throw new Error('Failed to initialize S3 service');
      }
    }
    return S3Component.instance;
  }

  static async disconnect(): Promise<void> {
    if (S3Component.instance) {
      S3Component.instance = null;
      logger.info('S3 component disconnected');
    }
  }
}

export default S3Component;