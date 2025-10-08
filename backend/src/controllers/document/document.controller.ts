import { Request, Response } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import VehicleDocument from '../../models/core/VehicleDocument.model';
import Vehicle from '../../models/core/Vehicle.model';
import { AuthenticatedRequest } from '../../types/auth.types';
import { 
  DocumentType, 
  DocumentStatus, 
  DocumentVerificationData,
  DocumentUpdateData 
} from '../../types/vehicle.types';
import { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError, 
  ValidationError 
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import documentService from '../../services/core/document.service';
import s3Service from '../../services/storage/s3.service';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow documents and images
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and image files are allowed.'));
    }
  }
});

export class DocumentController {
  
  /**
   * Upload vehicle document
   * POST /api/vehicles/:vehicleId/documents
   */
  async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.id;
      const { documentType, expiryDate, description, tags } = req.body;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      // Validate document type
      const validDocumentTypes: DocumentType[] = [
        'title', 'registration', 'insurance', 'inspection', 'maintenance',
        'warranty', 'accident_report', 'lien_release', 'emissions', 'other'
      ];
      
      if (!documentType || !validDocumentTypes.includes(documentType)) {
        throw new BadRequestError('Valid document type is required');
      }

      // Find vehicle and check ownership
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Check if user can upload documents (owner or authorized service)
      const userRole = req.user?.role;
      if (vehicle.owner.toString() !== userId && userRole !== 'service' && userRole !== 'admin') {
        throw new UnauthorizedError('You are not authorized to upload documents for this vehicle');
      }

      // Check if files were uploaded
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new BadRequestError('At least one document file is required');
      }

      const files = req.files as Express.Multer.File[];
      const uploadedDocuments = [];

      // Process each file
      for (const file of files) {
        try {
          // Upload to S3
          const uploadResult = await documentService.uploadDocument(
            vehicleId,
            file,
            documentType,
            {
              expiryDate: expiryDate ? new Date(expiryDate) : undefined,
              description,
              tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
              uploadedBy: new Types.ObjectId(userId)
            }
          );

          uploadedDocuments.push(uploadResult);
          
        } catch (uploadError) {
          logger.error(`File upload failed for ${file.originalname}:`, uploadError);
          // Continue with other files, but log the error
        }
      }

      if (uploadedDocuments.length === 0) {
        throw new ValidationError('All file uploads failed');
      }

      logger.info(`Documents uploaded successfully for vehicle ${vehicleId}: ${uploadedDocuments.length} files`);

      res.status(201).json({
        status: 'success',
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
        data: {
          vehicleId,
          documents: uploadedDocuments,
          totalUploaded: uploadedDocuments.length,
          totalAttempted: files.length
        }
      });

    } catch (error) {
      logger.error('Document upload failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError ||
          error instanceof ValidationError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to upload document'
        });
      }
    }
  }

  /**
   * Get vehicle documents
   * GET /api/vehicles/:vehicleId/documents
   */
  async getVehicleDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const documentType = req.query.documentType as DocumentType;
      const status = req.query.status as DocumentStatus;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(vehicleId)) {
        throw new BadRequestError('Invalid vehicle ID format');
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Build query
      const query: any = { vehicleId: new Types.ObjectId(vehicleId) };
      if (documentType) query.documentType = documentType;
      if (status) query.status = status;

      const documents = await VehicleDocument.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'firstName lastName role')
        .populate('verifiedBy', 'firstName lastName role');

      const totalDocuments = await VehicleDocument.countDocuments(query);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle documents retrieved successfully',
        data: {
          vehicleId,
          vin: vehicle.vin,
          documents: documents.map(doc => doc.toObject()),
          pagination: {
            page,
            limit,
            total: totalDocuments,
            pages: Math.ceil(totalDocuments / limit)
          },
          filters: {
            documentType,
            status
          }
        }
      });

    } catch (error) {
      logger.error('Get vehicle documents failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve vehicle documents'
        });
      }
    }
  }

  /**
   * Get document details
   * GET /api/documents/:documentId
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId)
        .populate('uploadedBy', 'firstName lastName role email')
        .populate('verifiedBy', 'firstName lastName role email')
        .populate('vehicleId', 'vin make vehicleModel year');

      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Update download count
      await document.updateDownloadCount();

      res.status(200).json({
        status: 'success',
        message: 'Document details retrieved successfully',
        data: {
          document: document.toObject()
        }
      });

    } catch (error) {
      logger.error('Get document by ID failed:', error);
      
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve document details'
        });
      }
    }
  }

  /**
   * Update document
   * PUT /api/documents/:documentId
   */
  async updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const updateData: DocumentUpdateData = req.body;

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Check authorization
      const userRole = req.user?.role;
      if (document.uploadedBy.toString() !== userId && userRole !== 'admin') {
        throw new UnauthorizedError('You can only update your own documents');
      }

      // Update allowed fields
      const allowedUpdates = ['description', 'tags', 'expiryDate'];
      const updates: any = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      if (updateData.expiryDate) {
        updates.expiryDate = new Date(updateData.expiryDate);
      }

      updates.updatedAt = new Date();

      const updatedDocument = await VehicleDocument.findByIdAndUpdate(
        documentId,
        updates,
        { new: true, runValidators: true }
      ).populate('uploadedBy', 'firstName lastName role');

      logger.info(`Document updated successfully: ${documentId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Document updated successfully',
        data: {
          document: updatedDocument?.toObject()
        }
      });

    } catch (error) {
      logger.error('Document update failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update document'
        });
      }
    }
  }

  /**
   * Delete document
   * DELETE /api/documents/:documentId
   */
  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Check authorization
      const userRole = req.user?.role;
      if (document.uploadedBy.toString() !== userId && userRole !== 'admin') {
        throw new UnauthorizedError('You can only delete your own documents');
      }

      // Delete file from S3
      try {
        await s3Service.deleteFile(document.s3Key);
      } catch (s3Error) {
        logger.error(`Failed to delete S3 file: ${document.s3Key}`, s3Error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database
      await VehicleDocument.findByIdAndDelete(documentId);

      logger.info(`Document deleted successfully: ${documentId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully'
      });

    } catch (error) {
      logger.error('Document deletion failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete document'
        });
      }
    }
  }

  /**
   * Verify document
   * POST /api/documents/:documentId/verify
   */
  async verifyDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const verificationData: DocumentVerificationData = req.body;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // Only service and admin can verify documents
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'service') {
        throw new UnauthorizedError('Access denied: Only service providers and admins can verify documents');
      }

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Mark as verified
      await document.markAsVerified(
        new Types.ObjectId(userId),
        verificationData.verificationNotes,
        verificationData.verificationLevel
      );

      logger.info(`Document verified successfully: ${documentId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Document verified successfully',
        data: {
          documentId,
          verifiedAt: document.verifiedAt,
          verifiedBy: userId,
          verificationNotes: verificationData.verificationNotes,
          verificationLevel: verificationData.verificationLevel
        }
      });

    } catch (error) {
      logger.error('Document verification failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to verify document'
        });
      }
    }
  }

  /**
   * Reject document
   * POST /api/documents/:documentId/reject
   */
  async rejectDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const { rejectionReason } = req.body;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // Only service and admin can reject documents
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'service') {
        throw new UnauthorizedError('Access denied: Only service providers and admins can reject documents');
      }

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      if (!rejectionReason) {
        throw new BadRequestError('Rejection reason is required');
      }

      // Mark as rejected
      await document.markAsRejected(
        new Types.ObjectId(userId),
        rejectionReason
      );

      logger.info(`Document rejected successfully: ${documentId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Document rejected successfully',
        data: {
          documentId,
          rejectedAt: document.rejectedAt,
          rejectedBy: userId,
          rejectionReason
        }
      });

    } catch (error) {
      logger.error('Document rejection failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to reject document'
        });
      }
    }
  }

  /**
   * Get expiring documents
   * GET /api/documents/expiring
   */
  async getExpiringDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Admin can see all expiring documents, users can see their own
      if (userRole !== 'admin' && userRole !== 'service') {
        throw new UnauthorizedError('Access denied: Admin or service privileges required');
      }

      const daysAhead = parseInt(req.query.daysAhead as string) || 30;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const expiringDocuments = await VehicleDocument.findExpiring(daysAhead)
        .skip(skip)
        .limit(limit)
        .populate('vehicleId', 'vin make vehicleModel year')
        .populate('uploadedBy', 'firstName lastName email');

      const totalExpiring = await VehicleDocument.countDocuments({
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Expiring documents retrieved successfully',
        data: {
          expiringDocuments: expiringDocuments.map(doc => doc.toObject()),
          pagination: {
            page,
            limit,
            total: totalExpiring,
            pages: Math.ceil(totalExpiring / limit)
          },
          daysAhead
        }
      });

    } catch (error) {
      logger.error('Get expiring documents failed:', error);
      
      if (error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve expiring documents'
        });
      }
    }
  }

  /**
   * Download document
   * GET /api/documents/download/:documentId
   */
  async downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      if (!Types.ObjectId.isValid(documentId)) {
        throw new BadRequestError('Invalid document ID format');
      }

      const document = await VehicleDocument.findById(documentId).populate('vehicleId');
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Check authorization
      const userRole = req.user?.role;
      const vehicle = document.vehicleId as any;
      
      if (vehicle.owner.toString() !== userId && 
          document.uploadedBy.toString() !== userId && 
          userRole !== 'admin' && 
          userRole !== 'service') {
        throw new UnauthorizedError('You do not have permission to download this document');
      }

      // Get signed URL for download
      const downloadUrl = await documentService.getDownloadUrl(document.s3Key);

      // Update download count
      await document.updateDownloadCount();

      logger.info(`Document download initiated: ${documentId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Download URL generated successfully',
        data: {
          documentId,
          downloadUrl,
          fileName: document.originalName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
        }
      });

    } catch (error) {
      logger.error('Document download failed:', error);
      
      if (error instanceof BadRequestError || 
          error instanceof NotFoundError || 
          error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to generate download URL'
        });
      }
    }
  }

  /**
   * Get document statistics
   * GET /api/documents/stats
   */
  async getDocumentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      
      // Only admin can access global stats
      if (userRole !== 'admin') {
        throw new UnauthorizedError('Access denied: Admin privileges required');
      }

      const stats = await VehicleDocument.getStorageStats();

      const statusDistribution = await VehicleDocument.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const typeDistribution = await VehicleDocument.aggregate([
        { $group: { _id: '$documentType', count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Document statistics retrieved successfully',
        data: {
          storageStats: stats,
          statusDistribution,
          typeDistribution
        }
      });

    } catch (error) {
      logger.error('Get document stats failed:', error);
      
      if (error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve document statistics'
        });
      }
    }
  }

  /**
   * Get upload middleware
   */
  getUploadMiddleware() {
    return upload.array('documents', 10);
  }
}

export default new DocumentController(); 