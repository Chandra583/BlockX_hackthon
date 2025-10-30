import mongoose, { Schema, Document, Model } from 'mongoose';

// Document interface
export interface IVehicleDocumentDocument extends Document {
  vehicleId: mongoose.Types.ObjectId;
  vin: string;
  documentType: 'title' | 'registration' | 'insurance' | 'inspection' | 'service_record' | 'accident_report' | 'recall_notice' | 'warranty' | 'photo' | 'other';
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  filePath?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'archived';
  verificationStatus: 'pending' | 'verified' | 'failed' | 'not_required';
  expirationDate?: Date;
  expiryDate?: Date;
  issueDate?: Date;
  issuingAuthority?: string;
  documentNumber?: string;
  tags: string[];
  metadata?: Record<string, any>;
  s3Metadata?: {
    etag?: string;
    versionId?: string;
  };
  accessLevel: 'public' | 'owner_only' | 'restricted' | 'private';
  downloadCount: number;
  lastDownloadedAt?: Date;
  lastAccessed?: Date;
  lastModified?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  
  // Methods
  markAsVerified(verifiedBy?: mongoose.Types.ObjectId, comments?: string): Promise<void>;
  markAsRejected(rejectedBy?: mongoose.Types.ObjectId, reason?: string): Promise<void>;
  updateDownloadCount(): Promise<void>;
  checkExpiration(): boolean;
  generateThumbnail(): Promise<string>;
  archive(): Promise<void>;
}

// Static methods interface
export interface IVehicleDocumentModel extends Model<IVehicleDocumentDocument> {
  findByVehicle(vehicleId: string, documentType?: string): Promise<IVehicleDocumentDocument[]>;
  findByVIN(vin: string, documentType?: string): Promise<IVehicleDocumentDocument[]>;
  findByType(documentType: string, limit?: number): Promise<IVehicleDocumentDocument[]>;
  findPendingVerification(limit?: number): Promise<IVehicleDocumentDocument[]>;
  findExpiring(days?: number, limit?: number): Promise<IVehicleDocumentDocument[]>;
  getStorageStats(): Promise<any>;
  getVerificationStats(): Promise<any>;
  findExpired(limit?: number): Promise<IVehicleDocumentDocument[]>;
  findByTags(tags: string[], limit?: number): Promise<IVehicleDocumentDocument[]>;
}

const VehicleDocumentSchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    // Indexed via schema.index below
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    uppercase: true,
    trim: true,
    // Indexed via schema.index below
    validate: {
      validator: function(v: string) {
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'VIN must be 17 characters long and contain only valid characters'
    }
  },
  documentType: {
    type: String,
    enum: ['title', 'registration', 'insurance', 'inspection', 'service_record', 'accident_report', 'recall_notice', 'warranty', 'photo', 'other'],
    required: [true, 'Document type is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
    maxlength: [255, 'Original file name cannot exceed 255 characters']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [50 * 1024 * 1024, 'File size cannot exceed 50MB'] // 50MB limit
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    validate: {
      validator: function(v: string) {
        // Allow common document and image types
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/json'
        ];
        return allowedTypes.includes(v);
      },
      message: 'File type not supported'
    }
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'File URL must be a valid URL'
    }
  },
  thumbnailUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Thumbnail URL must be a valid URL'
    }
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user is required'],
    // Indexed via schema.index below
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'archived'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_required'],
    default: 'pending'
  },
  expirationDate: {
    type: Date
  },
  issueDate: {
    type: Date,
    index: true
  },
  issuingAuthority: {
    type: String,
    trim: true,
    maxlength: [200, 'Issuing authority cannot exceed 200 characters']
  },
  documentNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Document number cannot exceed 100 characters'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  accessLevel: {
    type: String,
    enum: ['public', 'owner_only', 'restricted', 'private'],
    default: 'owner_only',
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  lastDownloadedAt: {
    type: Date,
    index: true
  },
  lastAccessed: {
    type: Date
  },
  lastModified: {
    type: Date
  },
  filePath: {
    type: String
  },
  publicUrl: {
    type: String
  },
  thumbnailPath: {
    type: String
  },
  s3Metadata: {
    etag: { type: String },
    versionId: { type: String }
  },
  expiryDate: {
    type: Date
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'vehicledocuments'
});

// Compound indexes for complex queries
VehicleDocumentSchema.index({ vehicleId: 1, documentType: 1 });
VehicleDocumentSchema.index({ vin: 1, documentType: 1 });
VehicleDocumentSchema.index({ status: 1, verificationStatus: 1 });
VehicleDocumentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
VehicleDocumentSchema.index({ expirationDate: 1 }, { sparse: true });
VehicleDocumentSchema.index({ tags: 1 });

// Instance Methods
VehicleDocumentSchema.methods.markAsVerified = async function(verifiedBy?: mongoose.Types.ObjectId, comments?: string): Promise<void> {
  this.verificationStatus = 'verified';
  this.status = 'approved';
  if (verifiedBy) this.verifiedBy = verifiedBy;
  if (comments && !this.metadata) this.metadata = {};
  if (comments) this.metadata.verificationComments = comments;
  this.lastModified = new Date();
  await this.save();
};

VehicleDocumentSchema.methods.markAsRejected = async function(rejectedBy?: mongoose.Types.ObjectId, reason?: string): Promise<void> {
  this.verificationStatus = 'failed';
  this.status = 'rejected';
  if (!this.metadata) this.metadata = {};
  if (reason) this.metadata.rejectionReason = reason;
  if (rejectedBy) this.metadata.rejectedBy = rejectedBy;
  this.metadata.rejectedAt = new Date();
  this.lastModified = new Date();
  await this.save();
};

VehicleDocumentSchema.methods.updateDownloadCount = async function(): Promise<void> {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  await this.save();
};

VehicleDocumentSchema.methods.checkExpiration = function(): boolean {
  if (!this.expirationDate) return false;
  return new Date() > this.expirationDate;
};

VehicleDocumentSchema.methods.generateThumbnail = async function(): Promise<string> {
  // This would integrate with image processing service
  // For now, return a placeholder
  const thumbnailUrl = `${this.fileUrl}?thumbnail=true`;
  this.thumbnailUrl = thumbnailUrl;
  await this.save();
  return thumbnailUrl;
};

VehicleDocumentSchema.methods.archive = async function(): Promise<void> {
  this.status = 'archived';
  await this.save();
};

// Static Methods
VehicleDocumentSchema.statics.findByVehicle = function(vehicleId: string, documentType?: string) {
  const query: any = { vehicleId };
  if (documentType) query.documentType = documentType;
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.findByVIN = function(vin: string, documentType?: string) {
  const query: any = { vin: vin.toUpperCase() };
  if (documentType) query.documentType = documentType;
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.findByType = function(documentType: string, limit: number = 100) {
  return this.find({ documentType })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.findPendingVerification = function(limit: number = 100) {
  return this.find({ verificationStatus: 'pending' })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.findExpiring = function(days: number = 30, limit: number = 100) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expirationDate: { $lte: futureDate, $gte: new Date() },
    status: { $ne: 'archived' }
  })
    .sort({ expirationDate: 1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.findExpired = function(limit: number = 100) {
  return this.find({
    expirationDate: { $lt: new Date() },
    status: { $ne: 'expired' }
  })
    .sort({ expirationDate: 1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year');
};

VehicleDocumentSchema.statics.findByTags = function(tags: string[], limit: number = 100) {
  return this.find({ tags: { $in: tags } })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('uploadedBy', 'firstName lastName email role');
};

VehicleDocumentSchema.statics.getStorageStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$documentType',
        totalSize: { $sum: '$fileSize' },
        totalCount: { $sum: 1 },
        avgSize: { $avg: '$fileSize' },
        lastUploaded: { $max: '$uploadedAt' }
      }
    },
    {
      $sort: { totalSize: -1 }
    }
  ]);
};

VehicleDocumentSchema.statics.getVerificationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 },
        avgFileSize: { $avg: '$fileSize' },
        lastUpdated: { $max: '$updatedAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware
VehicleDocumentSchema.pre('save', function(next) {
  // Ensure VIN is uppercase
  if (this.vin) {
    this.vin = this.vin.toUpperCase();
  }
  
  // Auto-expire documents that have passed their expiration date
  if (this.expirationDate && new Date() > this.expirationDate && this.status !== 'expired') {
    this.status = 'expired';
  }
  
  // Set verification status based on document type
  if (this.isNew) {
    const autoVerifyTypes = ['photo', 'other'];
    if (autoVerifyTypes.includes(this.documentType)) {
      this.verificationStatus = 'not_required';
      this.status = 'approved';
    }
  }
  
  next();
});

// Post-save middleware
VehicleDocumentSchema.post('save', async function(doc) {
  // Update vehicle's document count or other related fields
  try {
    const Vehicle = mongoose.model('Vehicle');
    const vehicle = await Vehicle.findById(doc.vehicleId);
    
    if (vehicle) {
      // You could add document-related fields to vehicle model
      // For now, we'll just ensure the relationship exists
      console.log(`Document ${doc.title} saved for vehicle ${vehicle.vin}`);
    }
  } catch (error) {
    console.error('Error updating vehicle after document save:', error);
  }
});

// Create and export the model
const VehicleDocument: IVehicleDocumentModel = mongoose.model<IVehicleDocumentDocument, IVehicleDocumentModel>('VehicleDocument', VehicleDocumentSchema);

export default VehicleDocument; 