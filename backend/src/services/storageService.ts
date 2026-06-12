import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  key?: string;
}

export async function uploadToObjectStorage(
  localFilePath: string,
  key?: string,
  contentType?: string
): Promise<UploadResult> {
  const fileName = key || `${Date.now()}-${path.basename(localFilePath)}`;

  // If S3/Spaces env is configured, attempt to upload using AWS SDK v3 dynamically
  const hasS3 = !!(
    process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
  );

  if (hasS3) {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      const s3Config: any = {
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      };

      if (process.env.S3_ENDPOINT) {
        s3Config.endpoint = process.env.S3_ENDPOINT;
        s3Config.forcePathStyle = true;
      }

      const client = new S3Client(s3Config);
      const bucket = process.env.S3_BUCKET!;

      const fileStream = fs.createReadStream(localFilePath);

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: fileStream,
          ContentType: contentType || 'application/octet-stream',
        })
      );

      // Determine public URL
      const publicBase = process.env.S3_PUBLIC_URL;
      let url: string;
      if (publicBase) {
        url = `${publicBase.replace(/\/$/, '')}/${fileName}`;
      } else if (process.env.S3_ENDPOINT) {
        const endpointHost = process.env.S3_ENDPOINT.replace(/\/$/, '');
        url = `${endpointHost}/${bucket}/${fileName}`;
      } else {
        url = `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
      }

      return { url, key: fileName };
    } catch (err) {
      // Fall back to local storage when S3 upload fails
      console.error('S3 upload failed, falling back to local storage', err);
    }
  }

  // Local fallback
  return { url: `/uploads/${path.basename(localFilePath)}`, key: path.basename(localFilePath) };
}

export function ensureUploadsDir(baseDir: string) {
  const uploadDir = path.join(baseDir, '..', '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}
