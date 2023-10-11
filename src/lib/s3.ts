import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = 'ap-northeast-2';
const fileBucket = process.env.S3_BUCKET;
const thumbnailBucket = process.env.THUMBNAIL_BUCKET;

const s3Client = new S3Client({ region });

export const readFile = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: fileBucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();

  if (!byteArray) {
    throw new Error('Failed to read file');
  }

  return byteArray;
};

//Deprecated, 사용시 수정 필요
export const writeThumbnail = async (
  uid: string,
  key: string,
  data: Buffer,
) => {
  const command = new PutObjectCommand({
    Bucket: thumbnailBucket,
    Key: uid + '/' + key + '.png',
    Body: data,
  });

  await s3Client.send(command);
};

export const getFileSignedUrl = async (key: string) => {
  return await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: fileBucket,
      Key: key,
    }),
    { expiresIn: 60 },
  );
};
