import mongoose, { Schema, Document, Model } from 'mongoose';

// Install Document Interface
export interface IInstallDocument extends Document {
  vehicleId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  serviceProviderId?: mongoose.Types.ObjectId;
  deviceId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  requestedAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  cost?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  documents?: mongoose.Types.ObjectId[];
  feedback?: {
    rating: number; // 1-5 stars
    comment: string;
    submittedAt: Date;
  };
  
  // Methods
  assignToServiceProvider(serviceProviderId: string, notes?: string): Promise<void>;
  startInstallation(deviceId: string, notes?: string): Promise<void>;
  completeInstallation(notes?: string, feedback?: any): Promise<void>;
  cancelInstallation(reason: string): Promise<void>;
  getStatusHistory(): any[];
}

// Status History Schema
const StatusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'failed'],
    required: true
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  reason: {
    type: String,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: false,
  _id: true
});

// Main Install Schema
const InstallSchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required'],
    index: true
  },
  serviceProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  deviceId: {
    type: String,
    maxlength: [100, 'Device ID cannot exceed 100 characters'],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'pending',
    required: true,
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  assignedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Installation address is required'],
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      maxlength: [10, 'ZIP code cannot exceed 10 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  estimatedDuration: {
    type: Number,
    min: [15, 'Estimated duration must be at least 15 minutes'],
    max: [480, 'Estimated duration cannot exceed 8 hours']
  },
  actualDuration: {
    type: Number,
    min: [0, 'Actual duration cannot be negative'],
    max: [600, 'Actual duration cannot exceed 10 hours']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    max: [10000, 'Cost seems unrealistic']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'VehicleDocument'
  }],
  feedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [1000, 'Feedback comment cannot exceed 1000 characters']
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  statusHistory: [StatusHistorySchema]
}, {
  timestamps: true,
  collection: 'installs'
});

// Indexes for performance
InstallSchema.index({ vehicleId: 1, status: 1 });
InstallSchema.index({ ownerId: 1, status: 1 });
InstallSchema.index({ serviceProviderId: 1, status: 1 });
InstallSchema.index({ requestedAt: -1 });
InstallSchema.index({ status: 1, requestedAt: -1 });

// Instance Methods
InstallSchema.methods.assignToServiceProvider = async function(
  serviceProviderId: string,
  notes?: string
): Promise<void> {
  if (this.status !== 'pending') {
    throw new Error('Can only assign pending installations');
  }

  this.serviceProviderId = serviceProviderId;
  this.status = 'assigned';
  this.assignedAt = new Date();
  if (notes) this.notes = notes;

  // Add to status history
  this.statusHistory.push({
    status: 'assigned',
    changedBy: serviceProviderId,
    changedAt: new Date(),
    reason: 'Assigned to service provider',
    notes
  });

  await this.save();
};

InstallSchema.methods.startInstallation = async function(
  deviceId: string,
  notes?: string
): Promise<void> {
  if (this.status !== 'assigned') {
    throw new Error('Can only start assigned installations');
  }

  this.deviceId = deviceId;
  this.status = 'in_progress';
  this.startedAt = new Date();
  if (notes) this.notes = notes;

  // Add to status history
  this.statusHistory.push({
    status: 'in_progress',
    changedBy: this.serviceProviderId,
    changedAt: new Date(),
    reason: 'Installation started',
    notes
  });

  await this.save();
};

InstallSchema.methods.completeInstallation = async function(
  notes?: string,
  feedback?: any
): Promise<void> {
  if (this.status !== 'in_progress') {
    throw new Error('Can only complete in-progress installations');
  }

  this.status = 'completed';
  this.completedAt = new Date();
  if (notes) this.notes = notes;
  if (feedback) this.feedback = feedback;

  // Calculate actual duration if started
  if (this.startedAt) {
    this.actualDuration = Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }

  // Add to status history
  this.statusHistory.push({
    status: 'completed',
    changedBy: this.serviceProviderId,
    changedAt: new Date(),
    reason: 'Installation completed',
    notes
  });

  await this.save();
};

InstallSchema.methods.cancelInstallation = async function(
  reason: string
): Promise<void> {
  if (['completed', 'cancelled'].includes(this.status)) {
    throw new Error('Cannot cancel completed or already cancelled installations');
  }

  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  // Add to status history
  this.statusHistory.push({
    status: 'cancelled',
    changedBy: this.ownerId,
    changedAt: new Date(),
    reason: 'Installation cancelled',
    notes: reason
  });

  await this.save();
};

InstallSchema.methods.getStatusHistory = function(): any[] {
  return this.statusHistory.sort((a: any, b: any) => b.changedAt - a.changedAt);
};

// Static Methods
InstallSchema.statics.findByOwner = function(ownerId: string, status?: string) {
  const query: any = { ownerId };
  if (status) query.status = status;
  return this.find(query).sort({ requestedAt: -1 }).populate('vehicleId', 'vin make vehicleModel year');
};

InstallSchema.statics.findByServiceProvider = function(serviceProviderId: string, status?: string) {
  const query: any = { serviceProviderId };
  if (status) query.status = status;
  return this.find(query).sort({ requestedAt: -1 }).populate('vehicleId', 'vin make vehicleModel year');
};

InstallSchema.statics.getPendingInstalls = function() {
  return this.find({ status: 'pending' })
    .sort({ requestedAt: -1 })
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('ownerId', 'firstName lastName email');
};

InstallSchema.statics.getInstallStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware
InstallSchema.pre('save', function(next) {
  // Ensure status history is updated when status changes
  if (this.isModified('status') && this.statusHistory.length > 0) {
    const lastStatus = this.statusHistory[this.statusHistory.length - 1];
    if (lastStatus.status !== this.status) {
      this.statusHistory.push({
        status: this.status,
        changedBy: this.serviceProviderId || this.ownerId,
        changedAt: new Date(),
        reason: 'Status updated'
      });
    }
  }
  
  next();
});

// Create and export the model
const Install: Model<IInstallDocument> = mongoose.model<IInstallDocument>('Install', InstallSchema);

export default Install;



