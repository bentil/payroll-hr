import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config';
import { rootLogger as logger } from '../utils/logger';

interface S3UploadResult {
  key: string;
  bucket: string;
  location: string;
  etag?: string;
}

interface S3Config {
  endpoint?: string;
  bucketName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

export class S3Service {
  private s3Client: S3Client;
  private defaultBucket?: string;

  constructor(s3Config?: S3Config) {
    const finalConfig = s3Config || config.s3;
    
    if (!finalConfig.accessKeyId || !finalConfig.secretAccessKey) {
      throw new Error('S3 credentials are required');
    }

    this.defaultBucket = finalConfig.bucketName;

    const clientConfig: any = {
      region: finalConfig.region || 'us-east-1',
      credentials: {
        accessKeyId: finalConfig.accessKeyId,
        secretAccessKey: finalConfig.secretAccessKey,
      },
    };

    if (finalConfig.endpoint) {
      clientConfig.endpoint = finalConfig.endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.s3Client = new S3Client(clientConfig);
    logger.info('S3Service initialized successfully');
  }

  async uploadFile(
    bucketName: string,
    file: Buffer | Uint8Array | string,
    fileName: string,
    contentType?: string
  ): Promise<S3UploadResult> {
    try {
      const bucket = bucketName || this.defaultBucket;
      
      if (!bucket) {
        throw new Error('Bucket name is required');
      }

      const uploadParams: PutObjectCommandInput = {
        Bucket: bucket,
        Key: fileName,
        Body: file,
        ContentType: contentType,
      };

      const command = new PutObjectCommand(uploadParams);
      const response = await this.s3Client.send(command);

      logger.info(`File uploaded successfully to S3: ${fileName}`);

      return {
        key: fileName,
        bucket: bucket,
        location: `s3://${bucket}/${fileName}`,
        etag: response.ETag,
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  async generatePresignedUrl(
    bucketName: string,
    key: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    try {
      const bucket = bucketName || this.defaultBucket;
      
      if (!bucket) {
        throw new Error('Bucket name is required');
      }

      if (expiresInSeconds <= 0 || expiresInSeconds > 604800) {
        throw new Error('Expiration time must be between 1 second and 7 days');
      }

      const getObjectParams: GetObjectCommandInput = {
        Bucket: bucket,
        Key: key,
      };

      const command = new GetObjectCommand(getObjectParams);
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      logger.info(`Generated presigned URL for object: ${key}`);
      
      return presignedUrl;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  async uploadFileFromStream(
    bucketName: string,
    stream: NodeJS.ReadableStream,
    fileName: string,
    contentType?: string
  ): Promise<S3UploadResult> {
    try {
      const bucket = bucketName || this.defaultBucket;
      
      if (!bucket) {
        throw new Error('Bucket name is required');
      }

      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', async () => {
          try {
            const fileBuffer = Buffer.concat(chunks);
            const result = await this.uploadFile(bucket, fileBuffer, fileName, contentType);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      logger.error('Error uploading stream to S3:', error);
      throw error;
    }
  }
}

export default S3Service;