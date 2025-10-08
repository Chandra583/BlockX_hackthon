import { Types } from 'mongoose';
import VehicleDocument, { IVehicleDocumentDocument } from '../../models/core/VehicleDocument.model';
import Vehicle from '../../models/core/Vehicle.model';
import { s3Service, UploadOptions, UploadResult } from '../storage/s3.service';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { DocumentType, DocumentStatus, AccessLevel } from '../../types/vehicle.types';

export interface DocumentUploadOptions {
  vehicleId: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
  accessLevel?: AccessLevel;
  expiryDate?: Date;
  tags?: string[];
  isPublic?: boolean;
  generateThumbnail?: boolean;
}

export interface DocumentSearchOptions {
  vehicleId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  uploadedBy?: string;
  accessLevel?: AccessLevel;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentUpdateOptions {
  title?: string;
  description?: string;
  accessLevel?: AccessLevel;
  expiryDate?: Date;
  tags?: string[];
  status?: DocumentStatus;
  rejectionReason?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  totalSize: number;
  recentUploads: number;
  expiringCount: number;
}

export class DocumentService {
  
  /**
   * Upload a new document
   */
  async uploadDocument(options: DocumentUploadOptions): Promise<IVehicleDocumentDocument> {
    try {
      // Validate vehicle exists
      const vehicle = await Vehicle.findById(options.vehicleId);
      if (!vehicle) {
        throw new AppError(404, 'Vehicle not found');
      }

      // Prepare S3 upload options
      const s3Options: UploadOptions = {
        folder: `documents/${options.documentType}`,
        vehicleId: options.vehicleId,
        originalName: options.file.originalName,
        mimeType: options.file.mimeType,
        buffer: options.file.buffer,
        userId: options.userId,
        generateThumbnail: options.generateThumbnail || false,
        isPublic: options.isPublic || false
      };

      // Upload to S3
      const uploadResult: UploadResult = await s3Service.uploadFile(s3Options);

      // Create document record
      const document = new VehicleDocument({
        vehicleId: new Types.ObjectId(options.vehicleId),
        documentType: options.documentType,
        title: options.title,
        description: options.description,
        fileName: options.file.originalName,
        filePath: uploadResult.key,
        fileUrl: uploadResult.url,
        publicUrl: uploadResult.publicUrl,
        thumbnailPath: uploadResult.thumbnailKey,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileSize: uploadResult.size,
        mimeType: options.file.mimeType,
        uploadedBy: new Types.ObjectId(options.userId),
        accessLevel: options.accessLevel || 'private',
        expiryDate: options.expiryDate,
        tags: options.tags || [],
        s3Metadata: {
          etag: uploadResult.etag,
          versionId: uploadResult.versionId
        }
      });

      await document.save();
      
      logger.info(`✅ Document uploaded successfully: ${document._id}`);
      return document;

    } catch (error) {
      logger.error('❌ Document upload failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document upload failed');
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string, userId?: string): Promise<IVehicleDocumentDocument | null> {
    try {
      const document = await VehicleDocument.findById(documentId)
        .populate('vehicleId', 'vin make vehicleModel year')
        .populate('uploadedBy', 'name email')
        .populate('verifiedBy', 'name email');

      if (!document) {
        return null;
      }

      // Check access permissions
      if (userId && !this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      // Update last accessed
      document.lastAccessed = new Date();
      await document.save();

      return document;

    } catch (error) {
      logger.error('❌ Get document failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Failed to retrieve document');
    }
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(options: DocumentSearchOptions): Promise<{
    documents: IVehicleDocumentDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const query: any = {};

      // Apply filters
      if (options.vehicleId) query.vehicleId = new Types.ObjectId(options.vehicleId);
      if (options.documentType) query.documentType = options.documentType;
      if (options.status) query.status = options.status;
      if (options.uploadedBy) query.uploadedBy = new Types.ObjectId(options.uploadedBy);
      if (options.accessLevel) query.accessLevel = options.accessLevel;
      if (options.tags && options.tags.length > 0) query.tags = { $in: options.tags };
      
      // Date range filter
      if (options.startDate || options.endDate) {
        query.uploadDate = {};
        if (options.startDate) query.uploadDate.$gte = options.startDate;
        if (options.endDate) query.uploadDate.$lte = options.endDate;
      }

      // Pagination
      const limit = options.limit || 20;
      const skip = options.skip || 0;
      const page = Math.floor(skip / limit) + 1;

      // Sorting
      const sortBy = options.sortBy || 'uploadDate';
      const sortOrder = options.sortOrder || 'desc';
      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query
      const [documents, total] = await Promise.all([
        VehicleDocument.find(query)
          .populate('vehicleId', 'vin make vehicleModel year')
          .populate('uploadedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        VehicleDocument.countDocuments(query)
      ]);

      return {
        documents,
        total,
        page,
        limit
      };

    } catch (error) {
      logger.error('❌ Document search failed:', error);
      throw new AppError(500, 'Document search failed');
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, updates: DocumentUpdateOptions, userId: string): Promise<IVehicleDocumentDocument> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      // Check permissions
      if (!this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      // Apply updates
      if (updates.title !== undefined) document.title = updates.title;
      if (updates.description !== undefined) document.description = updates.description;
      if (updates.accessLevel !== undefined) document.accessLevel = updates.accessLevel;
      if (updates.expiryDate !== undefined) document.expiryDate = updates.expiryDate;
      if (updates.tags !== undefined) document.tags = updates.tags;
      if (updates.status !== undefined) document.status = updates.status;
      if (updates.rejectionReason !== undefined) {
        if (!document.metadata) document.metadata = {};
        document.metadata.rejectionReason = updates.rejectionReason;
      }
      document.lastModified = new Date();

      await document.save();
      
      logger.info(`✅ Document updated successfully: ${documentId}`);
      return document;

    } catch (error) {
      logger.error('❌ Document update failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document update failed');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      // Check permissions
      if (!this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      // Delete from S3
      if (document.filePath && document.s3Metadata) {
        await s3Service.deleteFile(document.filePath, document.s3Metadata.versionId);
      }

      // Delete from database
      await VehicleDocument.findByIdAndDelete(documentId);
      
      logger.info(`✅ Document deleted successfully: ${documentId}`);

    } catch (error) {
      logger.error('❌ Document deletion failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document deletion failed');
    }
  }

  /**
   * Download document file
   */
  async downloadDocument(documentId: string, userId?: string): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      // Check access permissions
      if (userId && !this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      // Download from S3
      const downloadOptions: any = {
        key: document.filePath || document.fileUrl
      };
      if (document.s3Metadata?.versionId) {
        downloadOptions.versionId = document.s3Metadata.versionId;
      }
      const buffer = await s3Service.downloadFile(downloadOptions);

      // Update download count
      await document.updateDownloadCount();

      return {
        buffer,
        fileName: document.fileName,
        mimeType: document.mimeType
      };

    } catch (error) {
      logger.error('❌ Document download failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document download failed');
    }
  }

  /**
   * Get signed URL for document access
   */
  async getDocumentUrl(documentId: string, userId?: string, expiresIn: number = 3600): Promise<string> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      // Check access permissions
      if (userId && !this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      // Generate signed URL
      const urlOptions: any = {
        key: document.filePath || document.fileUrl,
        expires: expiresIn,
        responseContentDisposition: `attachment; filename="${document.fileName}"`
      };
      if (document.s3Metadata?.versionId) {
        urlOptions.versionId = document.s3Metadata.versionId;
      }
      const url = await s3Service.getSignedUrl(urlOptions);

      // Update last accessed
      document.lastAccessed = new Date();
      await document.save();

      return url;

    } catch (error) {
      logger.error('❌ Signed URL generation failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Signed URL generation failed');
    }
  }

  /**
   * Verify document
   */
  async verifyDocument(documentId: string, verifiedBy: string, comments?: string): Promise<IVehicleDocumentDocument> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      await document.markAsVerified(new Types.ObjectId(verifiedBy), comments);
      
      logger.info(`✅ Document verified successfully: ${documentId}`);
      return document;

    } catch (error) {
      logger.error('❌ Document verification failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document verification failed');
    }
  }

  /**
   * Reject document
   */
  async rejectDocument(documentId: string, rejectedBy: string, reason: string): Promise<IVehicleDocumentDocument> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      await document.markAsRejected(new Types.ObjectId(rejectedBy), reason);
      
      logger.info(`✅ Document rejected successfully: ${documentId}`);
      return document;

    } catch (error) {
      logger.error('❌ Document rejection failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document rejection failed');
    }
  }

  /**
   * Get documents expiring soon
   */
  async getExpiringDocuments(days: number = 30): Promise<IVehicleDocumentDocument[]> {
    try {
      const documents = await VehicleDocument.findExpiring(days);
      return documents;

    } catch (error) {
      logger.error('❌ Get expiring documents failed:', error);
      throw new AppError(500, 'Failed to get expiring documents');
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(vehicleId?: string): Promise<DocumentStats> {
    try {
      const query = vehicleId ? { vehicleId: new Types.ObjectId(vehicleId) } : {};
      
      const [
        totalDocuments,
        documentsByType,
        documentsByStatus,
        sizeStats,
        recentUploads,
        expiringCount
      ] = await Promise.all([
        VehicleDocument.countDocuments(query),
        VehicleDocument.aggregate([
          { $match: query },
          { $group: { _id: '$documentType', count: { $sum: 1 } } }
        ]),
        VehicleDocument.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        VehicleDocument.aggregate([
          { $match: query },
          { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]),
        VehicleDocument.countDocuments({
          ...query,
          uploadDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        VehicleDocument.countDocuments({
          ...query,
          expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      // Format results
      const typeStats: any = {};
      documentsByType.forEach((item: any) => {
        typeStats[item._id] = item.count;
      });

      const statusStats: any = {};
      documentsByStatus.forEach((item: any) => {
        statusStats[item._id] = item.count;
      });

      const totalSize = sizeStats.length > 0 ? sizeStats[0].totalSize : 0;

      return {
        totalDocuments,
        documentsByType: typeStats,
        documentsByStatus: statusStats,
        totalSize,
        recentUploads,
        expiringCount
      };

    } catch (error) {
      logger.error('❌ Document stats failed:', error);
      throw new AppError(500, 'Failed to get document statistics');
    }
  }

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(documentIds: string[], userId: string): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    try {
      let deletedCount = 0;
      const errors: string[] = [];

      for (const documentId of documentIds) {
        try {
          await this.deleteDocument(documentId, userId);
          deletedCount++;
        } catch (error: any) {
          errors.push(`Failed to delete ${documentId}: ${error.message}`);
        }
      }

      logger.info(`✅ Bulk deletion completed: ${deletedCount} deleted, ${errors.length} errors`);
      
      return { deletedCount, errors };

    } catch (error) {
      logger.error('❌ Bulk deletion failed:', error);
      throw new AppError(500, 'Bulk deletion failed');
    }
  }

  /**
   * Clean up expired documents
   */
  async cleanupExpiredDocuments(): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      const expiredDocs = await VehicleDocument.find({
        expiryDate: { $lte: new Date() },
        status: { $ne: 'deleted' }
      });

      let deletedCount = 0;
      const errors: string[] = [];

      for (const doc of expiredDocs) {
        try {
          // Delete from S3
          if (doc.filePath && doc.s3Metadata) {
            await s3Service.deleteFile(doc.filePath, doc.s3Metadata.versionId);
          }
          
          // Mark as archived instead of deleted since 'deleted' is not a valid status
          doc.status = 'archived';
          await doc.save();
          
          deletedCount++;
        } catch (error: any) {
          errors.push(`Failed to cleanup ${doc._id}: ${error.message}`);
        }
      }

      logger.info(`✅ Cleanup completed: ${deletedCount} documents cleaned up, ${errors.length} errors`);
      
      return { deletedCount, errors };

    } catch (error) {
      logger.error('❌ Document cleanup failed:', error);
      throw new AppError(500, 'Document cleanup failed');
    }
  }

  /**
   * Check document access permissions
   */
  private checkDocumentAccess(document: any, userId: string): boolean {
    // System admin has full access
    if (userId === 'system' || userId === 'admin') {
      return true;
    }

    // Document owner has access
    if (document.uploadedBy.toString() === userId) {
      return true;
    }

    // Public documents are accessible to all
    if (document.accessLevel === 'public') {
      return true;
    }

    // TODO: Implement role-based access control
    // For now, deny access to private documents
    return false;
  }

  /**
   * Get document by VIN and type
   */
  async getDocumentByVin(vin: string, documentType: DocumentType): Promise<IVehicleDocumentDocument | null> {
    try {
      const vehicle = await Vehicle.findOne({ vin });
      
      if (!vehicle) {
        return null;
      }

      const document = await VehicleDocument.findOne({
        vehicleId: vehicle._id,
        documentType,
        status: { $ne: 'deleted' }
      }).populate('uploadedBy', 'name email');

      return document;

    } catch (error) {
      logger.error('❌ Get document by VIN failed:', error);
      throw new AppError(500, 'Failed to get document by VIN');
    }
  }

  /**
   * Update document tags
   */
  async updateDocumentTags(documentId: string, tags: string[], userId: string): Promise<IVehicleDocumentDocument> {
    try {
      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new AppError(404, 'Document not found');
      }

      // Check permissions
      if (!this.checkDocumentAccess(document, userId)) {
        throw new AppError(403, 'Access denied');
      }

      document.tags = tags;
      document.lastModified = new Date();
      await document.save();

      logger.info(`✅ Document tags updated successfully: ${documentId}`);
      return document;

    } catch (error) {
      logger.error('❌ Document tags update failed:', error);
      throw error instanceof AppError ? error : new AppError(500, 'Document tags update failed');
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService(); 