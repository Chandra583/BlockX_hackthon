import mongoose, { Document, Schema } from 'mongoose';

// Service provider for device installation and maintenance
export interface IServiceProvider extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User account
  companyName: string;
  licenseNumber: string;
  certifications: string[];
  
  // Service areas and capabilities
  serviceAreas: Array<{
    city: string;
    state: string;
    zipCodes: string[];
    radius: number; // in kilometers
  }>;
  
  capabilities: Array<{
    deviceType: string;
    installationType: 'basic' | 'advanced' | 'expert';
    estimatedTime: number; // in minutes
    cost: number;
  }>;
  
  // Availability and scheduling
  availability: {
    workingHours: {
      monday: { start: string; end: string; available: boolean };
      tuesday: { start: string; end: string; available: boolean };
      wednesday: { start: string; end: string; available: boolean };
      thursday: { start: string; end: string; available: boolean };
      friday: { start: string; end: string; available: boolean };
      saturday: { start: string; end: string; available: boolean };
      sunday: { start: string; end: string; available: boolean };
    };
    holidays: Date[];
    emergencyAvailable: boolean;
  };
  
  // Performance metrics
  metrics: {
    totalInstallations: number;
    successfulInstallations: number;
    averageRating: number;
    totalRatings: number;
    averageInstallationTime: number;
    onTimePercentage: number;
    customerSatisfactionScore: number;
  };
  
  // Current workload
  currentAssignments: Array<{
    deviceId: mongoose.Types.ObjectId;
    vehicleId: mongoose.Types.ObjectId;
    scheduledDate: Date;
    status: string;
    priority: string;
  }>;
  
  // Contact and location
  contactInfo: {
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  
  // Verification and status
  verificationStatus: 'pending' | 'verified' | 'suspended' | 'rejected';
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  
  // Financial information
  paymentInfo: {
    bankAccount?: string;
    taxId?: string;
    paymentMethod: 'bank_transfer' | 'check' | 'digital_wallet';
    ratePerHour: number;
    minimumCharge: number;
  };
}

const ServiceProviderSchema = new Schema<IServiceProvider>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  certifications: [{
    type: String,
    trim: true
  }],
  
  serviceAreas: [{
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCodes: [String],
    radius: {
      type: Number,
      default: 50,
      min: 1,
      max: 500
    }
  }],
  
  capabilities: [{
    deviceType: {
      type: String,
      enum: ['ESP32_Telematics', 'OBD_Scanner', 'GPS_Tracker', 'Custom'],
      required: true
    },
    installationType: {
      type: String,
      enum: ['basic', 'advanced', 'expert'],
      default: 'basic'
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 15,
      max: 480
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  availability: {
    workingHours: {
      monday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        available: { type: Boolean, default: true }
      },
      tuesday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        available: { type: Boolean, default: true }
      },
      wednesday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        available: { type: Boolean, default: true }
      },
      thursday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        available: { type: Boolean, default: true }
      },
      friday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
        available: { type: Boolean, default: true }
      },
      saturday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '15:00' },
        available: { type: Boolean, default: false }
      },
      sunday: {
        start: { type: String, default: '10:00' },
        end: { type: String, default: '14:00' },
        available: { type: Boolean, default: false }
      }
    },
    holidays: [Date],
    emergencyAvailable: {
      type: Boolean,
      default: false
    }
  },
  
  metrics: {
    totalInstallations: {
      type: Number,
      default: 0
    },
    successfulInstallations: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    averageInstallationTime: {
      type: Number,
      default: 0
    },
    onTimePercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    customerSatisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  currentAssignments: [{
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device'
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    scheduledDate: Date,
    status: String,
    priority: String
  }],
  
  contactInfo: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zipCode: {
        type: String,
        required: true,
        trim: true
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      }
    }
  },
  
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspended', 'rejected'],
    default: 'pending'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  joinedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  paymentInfo: {
    bankAccount: String,
    taxId: String,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'check', 'digital_wallet'],
      default: 'bank_transfer'
    },
    ratePerHour: {
      type: Number,
      required: true,
      min: 0
    },
    minimumCharge: {
      type: Number,
      required: true,
      min: 0
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ServiceProviderSchema.index({ userId: 1 }, { unique: true });
ServiceProviderSchema.index({ verificationStatus: 1, isActive: 1 });
ServiceProviderSchema.index({ 'serviceAreas.city': 1, 'serviceAreas.state': 1 });
ServiceProviderSchema.index({ 'capabilities.deviceType': 1 });
ServiceProviderSchema.index({ 'metrics.averageRating': -1 });

// Instance methods
ServiceProviderSchema.methods.canServiceArea = function(city: string, state: string, zipCode?: string): boolean {
  return this.serviceAreas.some(area => {
    const cityMatch = area.city.toLowerCase() === city.toLowerCase();
    const stateMatch = area.state.toLowerCase() === state.toLowerCase();
    const zipMatch = !zipCode || area.zipCodes.includes(zipCode);
    
    return cityMatch && stateMatch && zipMatch;
  });
};

ServiceProviderSchema.methods.canInstallDevice = function(deviceType: string): boolean {
  return this.capabilities.some(cap => cap.deviceType === deviceType);
};

ServiceProviderSchema.methods.getEstimatedCost = function(deviceType: string): number {
  const capability = this.capabilities.find(cap => cap.deviceType === deviceType);
  return capability ? capability.cost : 0;
};

ServiceProviderSchema.methods.getEstimatedTime = function(deviceType: string): number {
  const capability = this.capabilities.find(cap => cap.deviceType === deviceType);
  return capability ? capability.estimatedTime : 0;
};

ServiceProviderSchema.methods.isAvailableOn = function(date: Date): boolean {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const workingDay = this.availability.workingHours[dayName];
  
  if (!workingDay || !workingDay.available) {
    return false;
  }
  
  // Check if it's a holiday
  const isHoliday = this.availability.holidays.some(holiday => 
    holiday.toDateString() === date.toDateString()
  );
  
  return !isHoliday;
};

ServiceProviderSchema.methods.updateMetrics = function(installationData: any) {
  this.metrics.totalInstallations += 1;
  
  if (installationData.successful) {
    this.metrics.successfulInstallations += 1;
  }
  
  if (installationData.rating) {
    const totalRatingPoints = this.metrics.averageRating * this.metrics.totalRatings;
    this.metrics.totalRatings += 1;
    this.metrics.averageRating = (totalRatingPoints + installationData.rating) / this.metrics.totalRatings;
  }
  
  if (installationData.actualTime) {
    const totalTime = this.metrics.averageInstallationTime * (this.metrics.totalInstallations - 1);
    this.metrics.averageInstallationTime = (totalTime + installationData.actualTime) / this.metrics.totalInstallations;
  }
  
  if (installationData.onTime !== undefined) {
    const onTimeInstallations = Math.floor(this.metrics.onTimePercentage * (this.metrics.totalInstallations - 1) / 100);
    const newOnTimeCount = onTimeInstallations + (installationData.onTime ? 1 : 0);
    this.metrics.onTimePercentage = (newOnTimeCount / this.metrics.totalInstallations) * 100;
  }
};

// Static methods
ServiceProviderSchema.statics.findByArea = function(city: string, state: string, zipCode?: string) {
  const query: any = {
    verificationStatus: 'verified',
    isActive: true,
    'serviceAreas.city': new RegExp(city, 'i'),
    'serviceAreas.state': new RegExp(state, 'i')
  };
  
  if (zipCode) {
    query['serviceAreas.zipCodes'] = zipCode;
  }
  
  return this.find(query).sort({ 'metrics.averageRating': -1 });
};

ServiceProviderSchema.statics.findByCapability = function(deviceType: string) {
  return this.find({
    verificationStatus: 'verified',
    isActive: true,
    'capabilities.deviceType': deviceType
  }).sort({ 'metrics.averageRating': -1 });
};

ServiceProviderSchema.statics.findAvailable = function(date: Date, deviceType: string) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  return this.find({
    verificationStatus: 'verified',
    isActive: true,
    'capabilities.deviceType': deviceType,
    [`availability.workingHours.${dayName}.available`]: true,
    'availability.holidays': { $ne: date }
  }).sort({ 'metrics.averageRating': -1 });
};

const ServiceProvider = mongoose.model<IServiceProvider>('ServiceProvider', ServiceProviderSchema);

export default ServiceProvider;
