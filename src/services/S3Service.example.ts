import S3Component from '../components/s3.component';
import { S3Service } from './S3Service';

async function exampleUsage() {
  const s3Service = S3Component.getInstance();

  const fileBuffer = Buffer.from('Hello, World!', 'utf-8');
  const uploadResult = await s3Service.uploadFile(
    'my-bucket',
    fileBuffer,
    'test-files/hello.txt',
    'text/plain'
  );
  console.log('Upload result:', uploadResult);

  const presignedUrl = await s3Service.generatePresignedUrl(
    'my-bucket',
    'test-files/hello.txt',
    3600
  );
  console.log('Presigned URL:', presignedUrl);

  const customS3Service = new S3Service({
    endpoint: 'https://s3.custom-endpoint.com',
    bucketName: 'custom-bucket',
    accessKeyId: 'CUSTOM_ACCESS_KEY',
    secretAccessKey: 'CUSTOM_SECRET_KEY',
    region: 'eu-west-1',
  });

  const customUploadResult = await customS3Service.uploadFile(
    'another-bucket',
    fileBuffer,
    'custom-files/test.txt',
    'text/plain'
  );
  console.log('Custom upload result:', customUploadResult);
}

export { exampleUsage };