import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMileageHistoryDocument extends Document {
  vehicleId: mongoose.Types.ObjectId;
  vin: string;
  mileage: number;
  recordedBy: mongoose.Types.ObjectId;
  recordedAt: Date;
  source: 'owner' | 'service' | 'inspection' | 'government' | 'automated';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  notes?: string;
  verified: boolean;
  blockchainHash?: string;
  deviceId?: string;
  photo?: string;
  previousMileage?: number;
  mileageIncrease?: number;
  
  // Methods
  validateMileageIncrease(): boolean;
  calculateMileageIncrease(): number;
  markAsVerified(): Promise<void>;
  addBlockchainHash(hash: string): Promise<void>;
}

const MileageHistorySchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    uppercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'VIN must be 17 characters long and contain only valid characters'
    }
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative'],
    max: [9999999, 'Mileage seems unrealistic'],
    index: true
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by user is required'],
    index: true
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['owner', 'service', 'inspection', 'government', 'automated'],
    required: [true, 'Mileage source is required'],
    index: true
  },
  location: {
    latitude: { 
      type: Number, 
      min: [-90, 'Latitude must be between -90 and 90'], 
      max: [90, 'Latitude must be between -90 and 90'] 
    },
    longitude: { 
      type: Number, 
      min: [-180, 'Longitude must be between -180 and 180'], 
      max: [180, 'Longitude must be between -180 and 180'] 
    },
    accuracy: { 
      type: Number, 
      min: [0, 'Accuracy cannot be negative'] 
    },
    timestamp: { 
      type: Date 
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  blockchainHash: {
    type: String,
    sparse: true,
    index: true
  },
  deviceId: {
    type: String,
    maxlength: [100, 'Device ID cannot exceed 100 characters']
  },
  photo: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Photo must be a valid URL'
    }
  },
  previousMileage: {
    type: Number,
    min: [0, 'Previous mileage cannot be negative']
  },
  mileageIncrease: {
    type: Number,
    min: [0, 'Mileage increase cannot be negative']
  }
}, {
  timestamps: true,
  collection: 'mileagehistory'
});

// Compound indexes for complex queries
MileageHistorySchema.index({ vehicleId: 1, recordedAt: -1 });
MileageHistorySchema.index({ vin: 1, recordedAt: -1 });
MileageHistorySchema.index({ source: 1, verified: 1 });
MileageHistorySchema.index({ recordedBy: 1, recordedAt: -1 });
MileageHistorySchema.index({ blockchainHash: 1 }, { sparse: true });

// Instance Methods
MileageHistorySchema.methods.validateMileageIncrease = function(): boolean {
  if (!this.previousMileage) return true;
  
  const increase = this.mileage - this.previousMileage;
  
  // Check for rollback
  if (increase < 0) return false;
  
  // Check for unrealistic increases (more than 1000 miles per day)
  if (this.previousMileage > 0) {
    const timeDiff = this.recordedAt.getTime() - this.createdAt.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    const dailyIncrease = increase / (daysDiff || 1);
    
    if (dailyIncrease > 1000) return false;
  }
  
  return true;
};

MileageHistorySchema.methods.calculateMileageIncrease = function(): number {
  if (!this.previousMileage) return 0;
  return Math.max(0, this.mileage - this.previousMileage);
};

MileageHistorySchema.methods.markAsVerified = async function(): Promise<void> {
  this.verified = true;
  await this.save();
};

MileageHistorySchema.methods.addBlockchainHash = async function(hash: string): Promise<void> {
  this.blockchainHash = hash;
  await this.save();
};

// Static Methods
MileageHistorySchema.statics.findByVehicle = function(vehicleId: string, limit: number = 50) {
  return this.find({ vehicleId })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('recordedBy', 'firstName lastName email role');
};

MileageHistorySchema.statics.findByVIN = function(vin: string, limit: number = 50) {
  return this.find({ vin: vin.toUpperCase() })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('recordedBy', 'firstName lastName email role');
};

MileageHistorySchema.statics.findBySource = function(source: string, limit: number = 100) {
  return this.find({ source })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('recordedBy', 'firstName lastName email role');
};

MileageHistorySchema.statics.findUnverified = function(limit: number = 100) {
  return this.find({ verified: false })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('recordedBy', 'firstName lastName email role');
};

MileageHistorySchema.statics.findWithoutBlockchain = function(limit: number = 100) {
  return this.find({ 
    verified: true, 
    blockchainHash: { $exists: false } 
  })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year');
};

MileageHistorySchema.statics.findSuspiciousRecords = function(limit: number = 50) {
  return this.aggregate([
    {
      $match: {
        mileageIncrease: { $gt: 500 } // More than 500 miles increase
      }
    },
    {
      $sort: { recordedAt: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'vehicles',
        localField: 'vehicleId',
        foreignField: '_id',
        as: 'vehicle'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'recordedBy',
        foreignField: '_id',
        as: 'user'
      }
    }
  ]);
};

MileageHistorySchema.statics.getAggregatedStats = function(vehicleId: string) {
  return this.aggregate([
    {
      $match: { vehicleId: new mongoose.Types.ObjectId(vehicleId) }
    },
    {
      $group: {
        _id: '$source',
        totalRecords: { $sum: 1 },
        verifiedRecords: { 
          $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] } 
        },
        avgMileageIncrease: { $avg: '$mileageIncrease' },
        maxMileageIncrease: { $max: '$mileageIncrease' },
        lastRecorded: { $max: '$recordedAt' }
      }
    },
    {
      $sort: { totalRecords: -1 }
    }
  ]);
};

// Pre-save middleware
MileageHistorySchema.pre('save', function(next) {
  // Ensure VIN is uppercase
  if (this.vin) {
    this.vin = this.vin.toUpperCase();
  }
  
  // Calculate mileage increase if previous mileage is available
  if (this.previousMileage && !this.mileageIncrease) {
    this.mileageIncrease = Math.max(0, this.mileage - this.previousMileage);
  }
  
  // Auto-verify government and inspection sources
  if (!this.verified && (this.source === 'government' || this.source === 'inspection')) {
    this.verified = true;
  }
  
  next();
});

// Post-save middleware
MileageHistorySchema.post('save', async function(doc) {
  // Update vehicle's current mileage if this is the latest record
  try {
    const Vehicle = mongoose.model('Vehicle');
    const vehicle = await Vehicle.findById(doc.vehicleId);
    
    if (vehicle && doc.mileage > vehicle.currentMileage) {
      vehicle.currentMileage = doc.mileage;
      vehicle.lastMileageUpdate = doc.recordedAt;
      await vehicle.save();
    }
  } catch (error) {
    console.error('Error updating vehicle mileage:', error);
  }
});

// Create and export the model
const MileageHistory: Model<IMileageHistoryDocument> = mongoose.model<IMileageHistoryDocument>('MileageHistory', MileageHistorySchema);

export default MileageHistory; 