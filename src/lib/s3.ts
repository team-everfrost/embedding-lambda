import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const region = 'ap-northeast-2';
const bucket = process.env.S3_BUCKET;

const s3Client = new S3Client({ region });

export const readFile = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();

  if (!byteArray) {
    throw new Error('Failed to read file');
  }

  return byteArray;
};
