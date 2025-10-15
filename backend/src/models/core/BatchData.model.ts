import mongoose, { Document, Schema } from 'mongoose';

// Batch data processing for ESP32 telemetry
export interface IBatchData extends Document {
  deviceID: string;
  vehicleId?: mongoose.Types.ObjectId;
  vin?: string;
  batchId: string;
  batchType: 'trip' | 'time' | 'daily';
  
  // Trip information
  tripStartTime: Date;
  tripEndTime?: Date;
  tripStatus: 'active' | 'completed' | 'submitted' | 'failed';
  
  // Data points in this batch
  dataPoints: Array<{
    timestamp: Date;
    mileage: number;
    rpm?: number;
    speed?: number;
    engineTemp?: number;
    fuelLevel?: number;
    batteryVoltage?: number;
    dataQuality?: number;
    odometerPID?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    };
    tamperingDetected?: boolean;
    validationStatus?: string;
  }>;
  
  // Batch summary
  summary: {
    totalDataPoints: number;
    startMileage: number;
    endMileage: number;
    mileageDifference: number;
    averageSpeed?: number;
    maxSpeed?: number;
    totalDistance?: number;
    fuelConsumed?: number;
    averageRPM?: number;
    engineHours?: number;
  };
  
  // Validation and fraud detection
  validation: {
    isValid: boolean;
    fraudScore: number;
    anomalies: string[];
    validationRules: Array<{
      rule: string;
      passed: boolean;
      message?: string;
    }>;
  };
  
  // Blockchain submission
  blockchainSubmission?: {
    submitted: boolean;
    submittedAt?: Date;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: number;
    submissionAttempts: number;
    lastError?: string;
  };
  
  // Processing metadata
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  retryCount: number;
  lastRetryAt?: Date;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const BatchDataSchema = new Schema<IBatchData>({
  deviceID: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  
  vin: {
    type: String,
    uppercase: true,
    trim: true,
    index: true
  },
  
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  batchType: {
    type: String,
    enum: ['trip', 'time', 'daily'],
    default: 'trip'
  },
  
  tripStartTime: {
    type: Date,
    required: true,
    index: true
  },
  
  tripEndTime: {
    type: Date,
    index: true
  },
  
  tripStatus: {
    type: String,
    enum: ['active', 'completed', 'submitted', 'failed'],
    default: 'active',
    index: true
  },
  
  dataPoints: [{
    timestamp: {
      type: Date,
      required: true
    },
    mileage: {
      type: Number,
      required: true,
      min: 0
    },
    rpm: {
      type: Number,
      min: 0,
      max: 10000
    },
    speed: {
      type: Number,
      min: 0,
      max: 500
    },
    engineTemp: {
      type: Number,
      min: -50,
      max: 200
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    batteryVoltage: {
      type: Number,
      min: 0,
      max: 15
    },
    dataQuality: {
      type: Number,
      min: 0,
      max: 100
    },
    odometerPID: String,
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      accuracy: {
        type: Number,
        min: 0
      }
    },
    tamperingDetected: {
      type: Boolean,
      default: false
    },
    validationStatus: {
      type: String,
      default: 'pending'
    }
  }],
  
  summary: {
    totalDataPoints: {
      type: Number,
      default: 0
    },
    startMileage: {
      type: Number,
      required: true
    },
    endMileage: {
      type: Number,
      required: true
    },
    mileageDifference: {
      type: Number,
      required: true
    },
    averageSpeed: Number,
    maxSpeed: Number,
    totalDistance: Number,
    fuelConsumed: Number,
    averageRPM: Number,
    engineHours: Number
  },
  
  validation: {
    isValid: {
      type: Boolean,
      default: true
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    anomalies: [String],
    validationRules: [{
      rule: String,
      passed: Boolean,
      message: String
    }]
  },
  
  blockchainSubmission: {
    submitted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date,
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number,
    submissionAttempts: {
      type: Number,
      default: 0
    },
    lastError: String
  },
  
  processedAt: Date,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  lastRetryAt: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
BatchDataSchema.index({ deviceID: 1, tripStartTime: -1 });
BatchDataSchema.index({ batchId: 1 }, { unique: true });
BatchDataSchema.index({ tripStatus: 1, createdAt: -1 });
BatchDataSchema.index({ 'blockchainSubmission.submitted': 1 });
BatchDataSchema.index({ vehicleId: 1, tripStartTime: -1 });

// Instance methods
BatchDataSchema.methods.addDataPoint = function(dataPoint: any) {
  this.dataPoints.push(dataPoint);
  this.summary.totalDataPoints = this.dataPoints.length;
  
  // Update summary
  if (this.dataPoints.length === 1) {
    this.summary.startMileage = dataPoint.mileage;
  }
  this.summary.endMileage = dataPoint.mileage;
  this.summary.mileageDifference = this.summary.endMileage - this.summary.startMileage;
  
  // Calculate averages
  const speeds = this.dataPoints.filter(dp => dp.speed).map(dp => dp.speed);
  if (speeds.length > 0) {
    this.summary.averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    this.summary.maxSpeed = Math.max(...speeds);
  }
  
  const rpms = this.dataPoints.filter(dp => dp.rpm).map(dp => dp.rpm);
  if (rpms.length > 0) {
    this.summary.averageRPM = rpms.reduce((a, b) => a + b, 0) / rpms.length;
  }
};

BatchDataSchema.methods.completeBatch = function() {
  this.tripEndTime = new Date();
  this.tripStatus = 'completed';
  this.processedAt = new Date();
  
  // Run validation
  this.runValidation();
};

BatchDataSchema.methods.runValidation = function() {
  const rules = [];
  let fraudScore = 0;
  const anomalies = [];
  
  // Rule 1: Check for mileage rollback
  if (this.summary.mileageDifference < 0) {
    rules.push({
      rule: 'mileage_rollback',
      passed: false,
      message: 'Mileage decreased during trip'
    });
    fraudScore += 50;
    anomalies.push('Mileage rollback detected');
  } else {
    rules.push({
      rule: 'mileage_rollback',
      passed: true
    });
  }
  
  // Rule 2: Check for unrealistic mileage increase
  const tripDurationHours = this.tripEndTime ? 
    (this.tripEndTime.getTime() - this.tripStartTime.getTime()) / (1000 * 60 * 60) : 0;
  
  if (tripDurationHours > 0 && this.summary.mileageDifference > (tripDurationHours * 120)) {
    rules.push({
      rule: 'unrealistic_mileage',
      passed: false,
      message: 'Mileage increase exceeds realistic driving speed'
    });
    fraudScore += 30;
    anomalies.push('Unrealistic mileage increase');
  } else {
    rules.push({
      rule: 'unrealistic_mileage',
      passed: true
    });
  }
  
  // Rule 3: Check for data quality
  const avgQuality = this.dataPoints
    .filter(dp => dp.dataQuality)
    .reduce((sum, dp) => sum + dp.dataQuality, 0) / this.dataPoints.length;
  
  if (avgQuality < 70) {
    rules.push({
      rule: 'data_quality',
      passed: false,
      message: 'Low data quality detected'
    });
    fraudScore += 20;
    anomalies.push('Low data quality');
  } else {
    rules.push({
      rule: 'data_quality',
      passed: true
    });
  }
  
  // Rule 4: Check for tampering flags
  const tamperingCount = this.dataPoints.filter(dp => dp.tamperingDetected).length;
  if (tamperingCount > 0) {
    rules.push({
      rule: 'tampering_detected',
      passed: false,
      message: `${tamperingCount} data points flagged for tampering`
    });
    fraudScore += tamperingCount * 10;
    anomalies.push('Tampering detected in data points');
  } else {
    rules.push({
      rule: 'tampering_detected',
      passed: true
    });
  }
  
  this.validation = {
    isValid: fraudScore < 50,
    fraudScore,
    anomalies,
    validationRules: rules
  };
};

// Static methods
BatchDataSchema.statics.createBatch = function(deviceID: string, vehicleId?: string, vin?: string): IBatchData {
  const batchId = `${deviceID}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new this({
    deviceID,
    vehicleId,
    vin,
    batchId,
    tripStartTime: new Date(),
    dataPoints: [],
    summary: {
      totalDataPoints: 0,
      startMileage: 0,
      endMileage: 0,
      mileageDifference: 0
    },
    validation: {
      isValid: true,
      fraudScore: 0,
      anomalies: [],
      validationRules: []
    }
  });
};

BatchDataSchema.statics.findActiveBatch = function(deviceID: string) {
  return this.findOne({
    deviceID,
    tripStatus: 'active'
  });
};

BatchDataSchema.statics.findPendingSubmission = function(limit: number = 10) {
  return this.find({
    tripStatus: 'completed',
    'blockchainSubmission.submitted': false,
    'validation.isValid': true
  })
  .sort({ tripEndTime: 1 })
  .limit(limit);
};

const BatchData = mongoose.model<IBatchData>('BatchData', BatchDataSchema);

export default BatchData;
