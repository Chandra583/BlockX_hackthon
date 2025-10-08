import mongoose, { Document, Schema } from 'mongoose';

// Device registration and management
export interface IDevice extends Document {
  deviceID: string;
  deviceType: 'ESP32_Telematics' | 'OBD_Scanner' | 'GPS_Tracker' | 'Custom';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description?: string;
  owner?: mongoose.Types.ObjectId; // Reference to User
  vehicle?: mongoose.Types.ObjectId; // Reference to Vehicle
  
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
    trim: true,
    index: true
  },
  
  deviceType: {
    type: String,
    enum: ['ESP32_Telematics', 'OBD_Scanner', 'GPS_Tracker', 'Custom'],
    default: 'ESP32_Telematics'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
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
DeviceSchema.index({ deviceID: 1 });
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
