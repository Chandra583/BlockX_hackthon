import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import sharp from 'sharp';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const unlinkAsync = promisify(fs.unlink);

// S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Types
export interface UploadOptions {
  folder: string;
  vehicleId: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  userId: string;
  generateThumbnail?: boolean;
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  etag: string;
  versionId?: string;
}

export interface DownloadOptions {
  key: string;
  versionId?: string;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface SignedUrlOptions {
  key: string;
  expires?: number; // seconds
  versionId?: string;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  storageClass: string;
  versionId?: string;
}

export class S3Service {
  private bucket: string;
  private region: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private documentExpiryDays: number;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_S3_REGION || 'us-east-1';
    this.maxFileSize = parseInt(process.env.DOCUMENT_MAX_SIZE || '52428800'); // 50MB
    this.allowedMimeTypes = (process.env.ALLOWED_DOCUMENT_TYPES || 'pdf,jpg,jpeg,png,gif,webp,doc,docx,txt').split(',');
    this.documentExpiryDays = parseInt(process.env.DOCUMENT_EXPIRY_DAYS || '2555'); // 7 years

    if (!this.bucket) {
      throw new AppError(500, 'AWS S3 bucket not configured');
    }

    this.validateConfiguration();
  }

  /**
   * Validate S3 configuration
   */
  private async validateConfiguration(): Promise<void> {
    try {
      await s3.headBucket({ Bucket: this.bucket }).promise();
      logger.info('✅ S3 bucket connection validated');
    } catch (error) {
      logger.error('❌ S3 bucket validation failed:', error);
      throw new AppError(500, 'S3 bucket validation failed');
    }
  }

  /**
   * Generate S3 key for file storage
   */
  private generateS3Key(folder: string, vehicleId: string, originalName: string): string {
    const timestamp = Date.now();
    const fileExtension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, fileExtension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = uuidv4().substring(0, 8);
    
    return `${folder}/${vehicleId}/${timestamp}_${uniqueId}_${sanitizedName}${fileExtension}`;
  }

  /**
   * Validate file upload parameters
   */
  private validateUpload(options: UploadOptions): void {
    // Check file size
    if (options.buffer.length > this.maxFileSize) {
      throw new AppError(400, `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    // Check MIME type
    const fileExtension = path.extname(options.originalName).toLowerCase().substring(1);
    if (!this.allowedMimeTypes.includes(fileExtension)) {
      throw new AppError(400, `File type ${fileExtension} not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Validate required fields
    if (!options.folder || !options.vehicleId || !options.originalName) {
      throw new AppError(400, 'Missing required upload parameters');
    }
  }

  /**
   * Create thumbnail for image files
   */
  private async createThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
    try {
      if (!mimeType.startsWith('image/')) {
        return null;
      }

      const thumbnailWidth = parseInt(process.env.THUMBNAIL_WIDTH || '300');
      const thumbnailHeight = parseInt(process.env.THUMBNAIL_HEIGHT || '200');

      return await sharp(buffer)
        .resize(thumbnailWidth, thumbnailHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      logger.warn('Thumbnail creation failed:', error);
      return null;
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      this.validateUpload(options);

      const key = this.generateS3Key(options.folder, options.vehicleId, options.originalName);
      
      // Prepare upload parameters
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'original-name': options.originalName,
          'vehicle-id': options.vehicleId,
          'uploaded-by': options.userId,
          'upload-timestamp': new Date().toISOString(),
          'file-size': options.buffer.length.toString()
        }
      };

      // Set public read if specified
      if (options.isPublic) {
        uploadParams.ACL = 'public-read';
      }

      // Upload main file
      const uploadResult = await s3.upload(uploadParams).promise();
      
      const result: UploadResult = {
        key: uploadResult.Key || key,
        url: uploadResult.Location,
        size: options.buffer.length,
        mimeType: options.mimeType,
        etag: uploadResult.ETag || '',
        versionId: (uploadResult as any).VersionId
      };

      // Generate public URL if public
      if (options.isPublic) {
        result.publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }

      // Create and upload thumbnail if requested
      if (options.generateThumbnail) {
        const thumbnailBuffer = await this.createThumbnail(options.buffer, options.mimeType);
        if (thumbnailBuffer) {
          const thumbnailKey = `thumbnails/${key}`;
          
          await s3.upload({
            Bucket: this.bucket,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            ServerSideEncryption: 'AES256',
            ACL: options.isPublic ? 'public-read' : undefined
          }).promise();

          result.thumbnailKey = thumbnailKey;
          result.thumbnailUrl = await this.getSignedUrl({ key: thumbnailKey, expires: 3600 });
        }
      }

      logger.info(`✅ File uploaded successfully: ${key}`);
      return result;

    } catch (error) {
      logger.error('❌ File upload failed:', error);
      throw new AppError(500, 'File upload failed');
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(options: DownloadOptions): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: options.key,
        VersionId: options.versionId
      };

      if (options.responseContentType) {
        params.ResponseContentType = options.responseContentType;
      }

      if (options.responseContentDisposition) {
        params.ResponseContentDisposition = options.responseContentDisposition;
      }

      const result = await s3.getObject(params).promise();
      
      if (!result.Body) {
        throw new AppError(404, 'File not found');
      }

      logger.info(`✅ File downloaded successfully: ${options.key}`);
      return result.Body as Buffer;

    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        throw new AppError(404, 'File not found');
      }
      logger.error('❌ File download failed:', error);
      throw new AppError(500, 'File download failed');
    }
  }

  /**
   * Get signed URL for secure file access
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: options.key,
        VersionId: options.versionId
      };

      if (options.responseContentType) {
        params.ResponseContentType = options.responseContentType;
      }

      if (options.responseContentDisposition) {
        params.ResponseContentDisposition = options.responseContentDisposition;
      }

      const expires = options.expires || 3600; // 1 hour default
      const url = await s3.getSignedUrlPromise('getObject', {
        ...params,
        Expires: expires
      });

      return url;

    } catch (error) {
      logger.error('❌ Signed URL generation failed:', error);
      throw new AppError(500, 'Signed URL generation failed');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string, versionId?: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId
      };

      await s3.deleteObject(params).promise();

      // Also delete thumbnail if it exists
      const thumbnailKey = `thumbnails/${key}`;
      try {
        await s3.deleteObject({
          Bucket: this.bucket,
          Key: thumbnailKey
        }).promise();
      } catch (error) {
        // Ignore thumbnail deletion errors
      }

      logger.info(`✅ File deleted successfully: ${key}`);

    } catch (error) {
      logger.error('❌ File deletion failed:', error);
      throw new AppError(500, 'File deletion failed');
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(key: string, versionId?: string): Promise<S3FileInfo> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId
      };

      const result = await s3.headObject(params).promise();

      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        etag: result.ETag || '',
        storageClass: result.StorageClass || 'STANDARD',
        versionId: result.VersionId
      };

    } catch (error: any) {
      if (error.code === 'NotFound') {
        throw new AppError(404, 'File not found');
      }
      logger.error('❌ File info retrieval failed:', error);
      throw new AppError(500, 'File info retrieval failed');
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<S3FileInfo[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await s3.listObjectsV2(params).promise();
      
      return (result.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
        storageClass: obj.StorageClass || 'STANDARD'
      }));

    } catch (error) {
      logger.error('❌ File listing failed:', error);
      throw new AppError(500, 'File listing failed');
    }
  }

  /**
   * Copy file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string, versionId?: string): Promise<void> {
    try {
      const copySource = versionId 
        ? `${this.bucket}/${sourceKey}?versionId=${versionId}`
        : `${this.bucket}/${sourceKey}`;

      await s3.copyObject({
        Bucket: this.bucket,
        CopySource: copySource,
        Key: destinationKey
      }).promise();

      logger.info(`✅ File copied successfully: ${sourceKey} -> ${destinationKey}`);

    } catch (error) {
      logger.error('❌ File copy failed:', error);
      throw new AppError(500, 'File copy failed');
    }
  }

  /**
   * Move file within S3 (copy + delete)
   */
  async moveFile(sourceKey: string, destinationKey: string, versionId?: string): Promise<void> {
    try {
      await this.copyFile(sourceKey, destinationKey, versionId);
      await this.deleteFile(sourceKey, versionId);
      
      logger.info(`✅ File moved successfully: ${sourceKey} -> ${destinationKey}`);

    } catch (error) {
      logger.error('❌ File move failed:', error);
      throw new AppError(500, 'File move failed');
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
    storageClasses: Record<string, number>;
  }> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket
      };

      let totalObjects = 0;
      let totalSize = 0;
      const storageClasses: Record<string, number> = {};

      let continuationToken: string | undefined;
      
      do {
        if (continuationToken) {
          params.ContinuationToken = continuationToken;
        }

        const result = await s3.listObjectsV2(params).promise();
        
        if (result.Contents) {
          totalObjects += result.Contents.length;
          
          for (const obj of result.Contents) {
            totalSize += obj.Size || 0;
            const storageClass = obj.StorageClass || 'STANDARD';
            storageClasses[storageClass] = (storageClasses[storageClass] || 0) + 1;
          }
        }

        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      return {
        totalObjects,
        totalSize,
        storageClasses
      };

    } catch (error) {
      logger.error('❌ Storage stats retrieval failed:', error);
      throw new AppError(500, 'Storage stats retrieval failed');
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.documentExpiryDays);

      const allFiles = await this.listFiles('');
      const expiredFiles = allFiles.filter(file => file.lastModified < cutoffDate);

      let deletedCount = 0;
      const errors: string[] = [];

      for (const file of expiredFiles) {
        try {
          await this.deleteFile(file.key);
          deletedCount++;
        } catch (error: any) {
          errors.push(`Failed to delete ${file.key}: ${error.message}`);
        }
      }

      logger.info(`✅ Cleanup completed: ${deletedCount} files deleted, ${errors.length} errors`);
      
      return { deletedCount, errors };

    } catch (error) {
      logger.error('❌ Cleanup failed:', error);
      throw new AppError(500, 'Cleanup failed');
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service(); 