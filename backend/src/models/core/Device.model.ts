import mongoose, { Document, Schema } from 'mongoose';

// Device registration and management
export interface IDevice extends Document {
  deviceID: string;
  deviceType: 'ESP32_Telematics' | 'OBD_Scanner' | 'GPS_Tracker' | 'Custom';
  status: 'active' | 'inactive' | 'maintenance' | 'error' | 'pending_installation' | 'installed';
  description?: string;
  owner?: mongoose.Types.ObjectId; // Reference to User
  vehicle?: mongoose.Types.ObjectId; // Reference to Vehicle
  
  // Service provider assignment
  assignedServiceProvider?: mongoose.Types.ObjectId; // Reference to User (service provider)
  installationStatus: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  installationRequest?: {
    requestedBy: mongoose.Types.ObjectId;
    requestedAt: Date;
    scheduledDate?: Date;
    notes?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  installationHistory?: Array<{
    serviceProvider: mongoose.Types.ObjectId;
    status: string;
    timestamp: Date;
    notes?: string;
    photos?: string[];
  }>;
  
  // Batch processing configuration
  batchProcessing: {
    enabled: boolean;
    batchType: 'trip' | 'time' | 'daily';
    batchSize: number;
    lastBatchSubmission?: Date;
    pendingDataCount: number;
  };
  
  // Device configuration
  configuration: {
    selectedVehicle: number; // 1=Hyundai, 2=Maruti, 3=Manual, 4=Auto, 99=Discovery
    sleepDurationMinutes: number;
    maxRetryAttempts: number;
    enableDataBuffering: boolean;
    enableSSL: boolean;
  };
  
  // Network and connectivity
  network: {
    apnName?: string;
    operatorName?: string;
    signalStrength?: string;
    simInfo?: string;
    ipAddress?: string;
  };
  
  // Device health and diagnostics
  health: {
    batteryVoltage?: number;
    freeHeap?: number;
    bootCount: number;
    lastError?: string;
    uptime?: number;
  };
  
  // Timestamps
  registeredAt: Date;
  lastSeen?: Date;
  lastDataReceived?: Date;
  
  // System fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  deviceID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  deviceType: {
    type: String,
    enum: ['ESP32_Telematics', 'OBD_Scanner', 'GPS_Tracker', 'Custom'],
    default: 'ESP32_Telematics'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error', 'pending_installation', 'installed'],
    default: 'pending_installation'
  },
  
  description: {
    type: String,
    trim: true
  },
  
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  // Service provider assignment fields
  assignedServiceProvider: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  installationStatus: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  installationRequest: {
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    scheduledDate: Date,
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  
  installationHistory: [{
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    photos: [String]
  }],
  
  // Batch processing configuration
  batchProcessing: {
    enabled: {
      type: Boolean,
      default: true
    },
    batchType: {
      type: String,
      enum: ['trip', 'time', 'daily'],
      default: 'trip'
    },
    batchSize: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000
    },
    lastBatchSubmission: Date,
    pendingDataCount: {
      type: Number,
      default: 0
    }
  },
  
  configuration: {
    selectedVehicle: {
      type: Number,
      default: 99,
      min: 1,
      max: 99
    },
    sleepDurationMinutes: {
      type: Number,
      default: 2,
      min: 1,
      max: 1440
    },
    maxRetryAttempts: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    enableDataBuffering: {
      type: Boolean,
      default: true
    },
    enableSSL: {
      type: Boolean,
      default: true
    }
  },
  
  network: {
    apnName: String,
    operatorName: String,
    signalStrength: String,
    simInfo: String,
    ipAddress: String
  },
  
  health: {
    batteryVoltage: {
      type: Number,
      min: 0,
      max: 15
    },
    freeHeap: Number,
    bootCount: {
      type: Number,
      default: 0
    },
    lastError: String,
    uptime: Number
  },
  
  registeredAt: {
    type: Date,
    default: Date.now
  },
  
  lastSeen: Date,
  lastDataReceived: Date,
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ lastSeen: -1 });
DeviceSchema.index({ owner: 1 });
DeviceSchema.index({ vehicle: 1 });

// Virtual for device age
DeviceSchema.virtual('deviceAge').get(function() {
  if (this.registeredAt) {
    return Math.floor((Date.now() - this.registeredAt.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for online status
DeviceSchema.virtual('isOnline').get(function() {
  if (this.lastSeen) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastSeen > fiveMinutesAgo;
  }
  return false;
});

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
