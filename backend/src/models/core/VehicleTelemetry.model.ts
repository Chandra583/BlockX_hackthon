import mongoose, { Document, Schema } from 'mongoose';

// Vehicle telemetry data from ESP32/OBD devices
export interface IVehicleTelemetry extends Document {
  deviceID: string;
  device?: mongoose.Types.ObjectId; // Reference to Device
  vehicle?: mongoose.Types.ObjectId; // Reference to Vehicle
  
  // Status and metadata
  status: 'obd_connected' | 'device_not_connected' | 'error' | 'discovery_mode';
  message: string;
  dataSource: 'veepeak_obd' | 'hyundai_uds' | 'device_status' | 'test' | 'manual';
  dataQuality: number; // 0-100 percentage
  
  // Vehicle identification
  vin?: string;
  
  // OBD/Vehicle data
  obd: {
    mileage?: number;
    rpm?: number;
    speed?: number;
    engineTemp?: number;
    fuelLevel?: number;
    odometerPID?: string;
    diagnosticCodes?: number;
  };
  
  // FIXED: Mileage validation fields
  mileageValidation: {
    reportedMileage: number; // What device reported
    previousMileage: number; // Authoritative previous mileage from vehicle
    newMileage: number; // Calculated new mileage (should equal reportedMileage if valid)
    delta: number; // newMileage - previousMileage
    flagged: boolean; // true if rollback detected
    validationStatus: 'VALID' | 'INVALID' | 'ROLLBACK_DETECTED' | 'SUSPICIOUS' | 'PENDING';
    reason?: string; // Why flagged
  };
  
  // Location data (if available)
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    timestamp?: Date;
  };
  
  // Device health at time of reading
  deviceHealth: {
    batteryVoltage?: number;
    bootCount?: number;
    signalStrength?: string;
    networkOperator?: string;
    freeHeap?: number;
  };
  
  // Anti-tampering and validation (DEPRECATED - use mileageValidation)
  validation: {
    lastKnownMileage?: number;
    mileageIncrement?: number;
    tamperingDetected: boolean;
    validationStatus: string;
    alternateOdometerReading?: number;
    alternateOdometerPID?: string;
    crossValidationResults?: Array<{
      pid: string;
      value: number;
      matches: boolean;
    }>;
  };
  
  // Discovery mode results (for vehicle type 99)
  discoveryResults?: Array<{
    pid: string;
    rawValue: number;
    rawResponse: string;
    plausible: boolean;
    score?: number;
  }>;
  
  // Raw ESP32 data
  rawData: {
    timestamp: number; // ESP32 millis()
    receivedAt: Date; // Server timestamp
    veepeakConnected?: boolean;
    httpAttempts?: number;
    transmissionSuccess: boolean;
  };
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const VehicleTelemetrySchema = new Schema<IVehicleTelemetry>({
  deviceID: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  device: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  status: {
    type: String,
    enum: ['obd_connected', 'device_not_connected', 'error', 'discovery_mode'],
    required: true,
    index: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  dataSource: {
    type: String,
    enum: ['veepeak_obd', 'hyundai_uds', 'device_status', 'test', 'manual'],
    required: true,
    index: true
  },
  
  dataQuality: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  vin: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v); // Standard VIN format
      },
      message: 'Invalid VIN format'
    }
  },
  
  obd: {
    mileage: {
      type: Number,
      min: 0,
      max: 999999
    },
    rpm: {
      type: Number,
      min: 0,
      max: 10000
    },
    speed: {
      type: Number,
      min: 0,
      max: 300
    },
    engineTemp: {
      type: Number,
      min: -40,
      max: 200
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    odometerPID: String,
    diagnosticCodes: Number
  },
  
  // FIXED: New mileage validation schema
  mileageValidation: {
    reportedMileage: {
      type: Number,
      required: true,
      min: 0
    },
    previousMileage: {
      type: Number,
      required: true,
      min: 0
    },
    newMileage: {
      type: Number,
      required: true,
      min: 0
    },
    delta: {
      type: Number,
      required: true
    },
    flagged: {
      type: Boolean,
      default: false,
      index: true
    },
    validationStatus: {
      type: String,
      enum: ['VALID', 'INVALID', 'ROLLBACK_DETECTED', 'SUSPICIOUS', 'PENDING'],
      default: 'PENDING',
      index: true
    },
    reason: String
  },
  
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
    },
    altitude: Number,
    heading: {
      type: Number,
      min: 0,
      max: 360
    },
    timestamp: Date
  },
  
  deviceHealth: {
    batteryVoltage: {
      type: Number,
      min: 0,
      max: 15
    },
    bootCount: {
      type: Number,
      min: 0
    },
    signalStrength: String,
    networkOperator: String,
    freeHeap: Number
  },
  
  // DEPRECATED: Keep for backwards compatibility
  validation: {
    lastKnownMileage: Number,
    mileageIncrement: Number,
    tamperingDetected: {
      type: Boolean,
      default: false,
      index: true
    },
    validationStatus: {
      type: String,
      default: 'PENDING'
    },
    alternateOdometerReading: Number,
    alternateOdometerPID: String,
    crossValidationResults: [{
      pid: String,
      value: Number,
      matches: Boolean
    }]
  },
  
  discoveryResults: [{
    pid: String,
    rawValue: Number,
    rawResponse: String,
    plausible: Boolean,
    score: Number
  }],
  
  rawData: {
    timestamp: {
      type: Number,
      required: true
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    veepeakConnected: Boolean,
    httpAttempts: Number,
    transmissionSuccess: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
VehicleTelemetrySchema.index({ deviceID: 1, 'rawData.receivedAt': -1 });
VehicleTelemetrySchema.index({ vin: 1, 'rawData.receivedAt': -1 });
VehicleTelemetrySchema.index({ 'mileageValidation.flagged': 1 });
VehicleTelemetrySchema.index({ 'mileageValidation.validationStatus': 1 });

export const VehicleTelemetry = mongoose.model<IVehicleTelemetry>('VehicleTelemetry', VehicleTelemetrySchema);