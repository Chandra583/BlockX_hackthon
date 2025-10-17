import mongoose, { Schema, Document, Model } from 'mongoose';

// Simplified Vehicle Document Interface
export interface IVehicleDocument extends Document {
  vin: string;
  vehicleNumber: string;
  ownerId: mongoose.Types.ObjectId;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineSize?: string;
  currentMileage: number;
  lastMileageUpdate: Date;
  mileageHistory: any[];
  verificationStatus: string;
  trustScore: number;
  fraudAlerts: any[];
  isForSale: boolean;
  listingStatus: string;
  description?: string;
  features: string[];
  condition: string;
  accidentHistory: any[];
  serviceHistory: any[];
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  registrationExpiry?: Date;
  insuranceExpiry?: Date;
  
  // Methods
  updateMileage(mileage: number, source: string, recordedBy: string, location?: any): Promise<void>;
  calculateTrustScore(): number;
  addFraudAlert(alert: any): Promise<void>;
  getLatestMileageRecord(): any | null;
  validateVIN(): boolean;
  blockchainHash?: string;
  blockchainAddress?: string;
}

// Mileage Record Schema
const MileageRecordSchema = new Schema({
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative'],
    max: [9999999, 'Mileage seems unrealistic']
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by user is required']
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  source: {
    type: String,
    enum: ['owner', 'service', 'inspection', 'government', 'automated'],
    required: [true, 'Mileage source is required']
  },
  location: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 },
    timestamp: { type: Date }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  verified: {
    type: Boolean,
    default: false
  },
  blockchainHash: {
    type: String,
    sparse: true
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
  }
}, {
  timestamps: true,
  _id: true
});

// Fraud Alert Schema
const FraudAlertSchema = new Schema({
  alertType: {
    type: String,
    enum: ['odometer_rollback', 'title_washing', 'duplicate_vin', 'stolen_vehicle', 'flood_damage', 'other'],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Alert severity is required']
  },
  description: {
    type: String,
    required: [true, 'Alert description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_positive'],
    default: 'active'
  },
  evidence: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Evidence must be a valid URL'
    }
  }],
  investigationNotes: {
    type: String,
    maxlength: [2000, 'Investigation notes cannot exceed 2000 characters']
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  _id: true
});

// Service Record Schema
const ServiceRecordSchema = new Schema({
  serviceId: {
    type: String,
    required: [true, 'Service ID is required']
  },
  serviceProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service provider is required']
  },
  serviceType: {
    type: String,
    enum: ['maintenance', 'repair', 'inspection', 'modification', 'other'],
    required: [true, 'Service type is required']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  partsReplaced: [{
    type: String,
    maxlength: [200, 'Part name cannot exceed 200 characters']
  }],
  laborHours: {
    type: Number,
    required: [true, 'Labor hours is required'],
    min: [0, 'Labor hours cannot be negative'],
    max: [1000, 'Labor hours seems unrealistic']
  },
  cost: {
    type: Number,
    required: [true, 'Service cost is required'],
    min: [0, 'Cost cannot be negative'],
    max: [1000000, 'Cost seems unrealistic']
  },
  mileageAtService: {
    type: Number,
    required: [true, 'Mileage at service is required'],
    min: [0, 'Mileage cannot be negative']
  },
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required']
  },
  nextServiceDue: {
    type: Date
  },
  warrantyInfo: {
    type: String,
    maxlength: [500, 'Warranty info cannot exceed 500 characters']
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'VehicleDocument'
  }],
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  _id: true
});

// Accident Record Schema
const AccidentRecordSchema = new Schema({
  accidentDate: {
    type: Date,
    required: [true, 'Accident date is required']
  },
  description: {
    type: String,
    required: [true, 'Accident description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'total_loss'],
    required: [true, 'Accident severity is required']
  },
  damageAreas: [{
    type: String,
    maxlength: [100, 'Damage area description cannot exceed 100 characters']
  }],
  repairCost: {
    type: Number,
    min: [0, 'Repair cost cannot be negative'],
    max: [1000000, 'Repair cost seems unrealistic']
  },
  insuranceClaimId: {
    type: String,
    maxlength: [50, 'Insurance claim ID cannot exceed 50 characters']
  },
  policeReportNumber: {
    type: String,
    maxlength: [50, 'Police report number cannot exceed 50 characters']
  },
  location: {
    type: String,
    maxlength: [200, 'Accident location cannot exceed 200 characters']
  },
  verified: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'VehicleDocument'
  }]
}, {
  timestamps: true,
  _id: true
});

// Main Vehicle Schema
const VehicleSchema = new Schema({
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'VIN must be 17 characters long and contain only valid characters'
    }
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    uppercase: true,
    trim: true,
    maxlength: [20, 'Vehicle number cannot exceed 20 characters'],
    validate: {
      validator: function(v: string) {
        // More flexible validation - allow various formats
        return /^[A-Z0-9]{4,20}$/.test(v);
      },
      message: 'Vehicle number must contain 4-20 alphanumeric characters'
    }
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
    index: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
    maxlength: [50, 'Make cannot exceed 50 characters']
  },
  vehicleModel: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year must be 1900 or later'],
    max: [new Date().getFullYear() + 2, 'Year cannot be more than 2 years in the future']
  },
  color: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  bodyType: {
    type: String,
    enum: ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'wagon', 'convertible', 'van', 'motorcycle', 'other'],
    required: [true, 'Body type is required']
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'hydrogen', 'other'],
    required: [true, 'Fuel type is required']
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic', 'cvt', 'semi-automatic'],
    required: [true, 'Transmission type is required']
  },
  engineSize: {
    type: String,
    maxlength: [20, 'Engine size cannot exceed 20 characters']
  },
  currentMileage: {
    type: Number,
    required: [true, 'Current mileage is required'],
    min: [0, 'Mileage cannot be negative'],
    max: [9999999, 'Mileage seems unrealistic']
  },
  lastMileageUpdate: {
    type: Date,
    default: Date.now,
    required: true
  },
  mileageHistory: [MileageRecordSchema],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged', 'rejected', 'expired'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  trustScore: {
    type: Number,
    default: 100,
    min: [0, 'Trust score cannot be negative'],
    max: [100, 'Trust score cannot exceed 100'],
    index: true
  },
  fraudAlerts: [FraudAlertSchema],
  isForSale: {
    type: Boolean,
    default: false,
    index: true
  },
  listingStatus: {
    type: String,
    enum: ['active', 'sold', 'pending', 'inactive', 'draft', 'expired', 'not_listed'],
    default: 'not_listed'
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  features: [{
    type: String,
    maxlength: [100, 'Feature cannot exceed 100 characters']
  }],
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: [true, 'Vehicle condition is required']
  },
  accidentHistory: [AccidentRecordSchema],
  serviceHistory: [ServiceRecordSchema],
  lastServiceDate: {
    type: Date
  },
  nextServiceDue: {
    type: Date
  },
  registrationExpiry: {
    type: Date
  },
  insuranceExpiry: {
    type: Date
  },
  blockchainHash: {
    type: String,
    index: true
  },
  blockchainAddress: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  collection: 'vehicles'
});

// Indexes for performance
VehicleSchema.index({ vin: 1 }, { unique: true });
VehicleSchema.index({ ownerId: 1 });
VehicleSchema.index({ make: 1, vehicleModel: 1 });
VehicleSchema.index({ year: 1 });
VehicleSchema.index({ isForSale: 1, listingStatus: 1 });
VehicleSchema.index({ verificationStatus: 1 });
VehicleSchema.index({ trustScore: -1 });
VehicleSchema.index({ createdAt: -1 });

// Instance Methods
VehicleSchema.methods.updateMileage = async function(
  mileage: number,
  source: string,
  recordedBy: string,
  location?: any
): Promise<void> {
  if (mileage < this.currentMileage) {
    await this.addFraudAlert({
      alertType: 'odometer_rollback',
      severity: 'high',
      description: `Potential odometer rollback detected. Previous: ${this.currentMileage}, New: ${mileage}`,
      reportedBy: recordedBy,
      reportedAt: new Date(),
      status: 'active'
    });
    throw new Error('Mileage cannot be less than current mileage');
  }

  const mileageRecord = {
    mileage,
    recordedBy,
    recordedAt: new Date(),
    source,
    location,
    verified: source === 'government' || source === 'inspection'
  };

  this.mileageHistory.push(mileageRecord);
  this.currentMileage = mileage;
  this.lastMileageUpdate = new Date();
  this.trustScore = this.calculateTrustScore();
  
  await this.save();
};

VehicleSchema.methods.calculateTrustScore = function(): number {
  let score = 100;
  
  const activeFraudAlerts = this.fraudAlerts.filter((alert: any) => alert.status === 'active');
  score -= activeFraudAlerts.length * 10;
  
  const criticalAlerts = activeFraudAlerts.filter((alert: any) => alert.severity === 'critical');
  score -= criticalAlerts.length * 20;
  
  if (this.verificationStatus === 'verified') {
    score += 10;
  }
  
  const recentServices = this.serviceHistory.filter(
    (service: any) => service.verified && 
    service.serviceDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  );
  score += Math.min(recentServices.length * 2, 10);
  
  return Math.max(0, Math.min(100, score));
};

VehicleSchema.methods.addFraudAlert = async function(alert: any): Promise<void> {
  this.fraudAlerts.push(alert);
  this.trustScore = this.calculateTrustScore();
  await this.save();
};

VehicleSchema.methods.getLatestMileageRecord = function(): any | null {
  if (this.mileageHistory.length === 0) return null;
  
  return this.mileageHistory.reduce((latest: any, current: any) => {
    return current.recordedAt > latest.recordedAt ? current : latest;
  });
};

VehicleSchema.methods.validateVIN = function(): boolean {
  if (!this.vin || this.vin.length !== 17) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(this.vin)) return false;
  return true;
};

// Static Methods
VehicleSchema.statics.findByVIN = function(vin: string) {
  return this.findOne({ vin: vin.toUpperCase() });
};

VehicleSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ ownerId }).sort({ createdAt: -1 });
};

VehicleSchema.statics.searchVehicles = function(query: any, options: any = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('ownerId', 'firstName lastName email');
};

VehicleSchema.statics.validateVIN = function(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
  return true;
};

// Pre-save middleware
VehicleSchema.pre('save', function(next) {
  if (this.vin) {
    this.vin = this.vin.toUpperCase();
  }
  
  if (this.isModified('fraudAlerts') || this.isModified('verificationStatus')) {
    // Cast to any to access instance methods in middleware context
    const doc = this as any;
    this.trustScore = doc.calculateTrustScore();
  }
  
  next();
});

// Create and export the model
const Vehicle: Model<IVehicleDocument> = mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema);

export default Vehicle;