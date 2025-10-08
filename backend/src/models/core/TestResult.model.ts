import mongoose, { Document, Schema } from 'mongoose';

// Test results and system diagnostics
export interface ITestResult extends Document {
  testType: 'device_status' | 'obd_connection' | 'network_test' | 'fraud_detection' | 'system_health' | 'curl_test';
  testName: string;
  deviceID?: string;
  device?: mongoose.Types.ObjectId;
  
  // Test execution
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  result: 'success' | 'error' | 'timeout' | 'invalid_data';
  
  // Test data and parameters
  testData: {
    input?: any; // Test input parameters
    output?: any; // Test output/response
    expected?: any; // Expected result
    actual?: any; // Actual result
  };
  
  // Performance metrics
  performance: {
    startTime: Date;
    endTime?: Date;
    duration?: number; // milliseconds
    responseTime?: number; // milliseconds
    dataSize?: number; // bytes
    attempts?: number;
  };
  
  // Test environment
  environment: {
    serverHost?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    clientIP?: string;
    protocol?: string;
  };
  
  // Error details (if failed)
  error?: {
    code?: string;
    message?: string;
    stack?: string;
    httpStatus?: number;
  };
  
  // Validation results
  validation: {
    dataValid: boolean;
    schemaValid: boolean;
    businessRulesValid: boolean;
    securityValid: boolean;
    validationErrors?: string[];
  };
  
  // Test metrics
  metrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkLatency?: number;
    dbQueryTime?: number;
    cacheHitRate?: number;
  };
  
  // Tags and categories
  tags: string[];
  category: 'functional' | 'performance' | 'security' | 'integration' | 'regression' | 'smoke';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Additional metadata
  metadata: {
    testRunner?: string;
    buildVersion?: string;
    environmentType: 'development' | 'staging' | 'production';
    automated: boolean;
    retryCount?: number;
  };
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

const TestResultSchema = new Schema<ITestResult>({
  testType: {
    type: String,
    enum: ['device_status', 'obd_connection', 'network_test', 'fraud_detection', 'system_health', 'curl_test'],
    required: true,
    index: true
  },
  
  testName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  deviceID: {
    type: String,
    trim: true,
    index: true
  },
  
  device: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  
  status: {
    type: String,
    enum: ['passed', 'failed', 'warning', 'skipped'],
    required: true,
    index: true
  },
  
  result: {
    type: String,
    enum: ['success', 'error', 'timeout', 'invalid_data'],
    required: true,
    index: true
  },
  
  testData: {
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    expected: Schema.Types.Mixed,
    actual: Schema.Types.Mixed
  },
  
  performance: {
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: Date,
    duration: Number,
    responseTime: Number,
    dataSize: Number,
    attempts: {
      type: Number,
      default: 1
    }
  },
  
  environment: {
    serverHost: String,
    endpoint: String,
    method: String,
    userAgent: String,
    clientIP: String,
    protocol: String
  },
  
  error: {
    code: String,
    message: String,
    stack: String,
    httpStatus: Number
  },
  
  validation: {
    dataValid: {
      type: Boolean,
      default: true
    },
    schemaValid: {
      type: Boolean,
      default: true
    },
    businessRulesValid: {
      type: Boolean,
      default: true
    },
    securityValid: {
      type: Boolean,
      default: true
    },
    validationErrors: [String]
  },
  
  metrics: {
    cpuUsage: Number,
    memoryUsage: Number,
    networkLatency: Number,
    dbQueryTime: Number,
    cacheHitRate: Number
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  category: {
    type: String,
    enum: ['functional', 'performance', 'security', 'integration', 'regression', 'smoke'],
    required: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  metadata: {
    testRunner: String,
    buildVersion: String,
    environmentType: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
      index: true
    },
    automated: {
      type: Boolean,
      default: false
    },
    retryCount: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
TestResultSchema.index({ testType: 1, status: 1, createdAt: -1 });
TestResultSchema.index({ deviceID: 1, createdAt: -1 });
TestResultSchema.index({ category: 1, priority: 1, createdAt: -1 });
TestResultSchema.index({ 'metadata.environmentType': 1, createdAt: -1 });
TestResultSchema.index({ tags: 1, createdAt: -1 });

// Virtual for test success rate
TestResultSchema.virtual('isSuccessful').get(function() {
  return this.status === 'passed' && this.result === 'success';
});

// Virtual for test duration in seconds
TestResultSchema.virtual('durationSeconds').get(function() {
  if (this.performance?.duration) {
    return Math.round(this.performance.duration / 1000 * 100) / 100;
  }
  return 0;
});

// Static method to get test statistics
TestResultSchema.statics.getTestStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        passed: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgDuration: { $avg: '$performance.duration' },
        avgResponseTime: { $avg: '$performance.responseTime' }
      }
    }
  ]);
};

export const TestResult = mongoose.model<ITestResult>('TestResult', TestResultSchema);
