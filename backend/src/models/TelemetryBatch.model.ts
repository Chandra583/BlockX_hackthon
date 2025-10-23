import mongoose, { Document, Schema } from 'mongoose';

export interface ITelemetryBatch extends Document {
  installId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  deviceId: string;
  date: string; // ISO date yyyy-mm-dd
  segments: Array<{
    startTime: Date;
    endTime: Date;
    distance: number;
    rawDataCID?: string;
  }>;
  totalDistance: number;
  segmentsCount: number;
  merkleRoot: string;
  arweaveTx: string;
  solanaTx: string;
  status: 'pending' | 'consolidating' | 'anchored' | 'error';
  lastError?: string;
  lastRecordedMileage: number;
  distanceDelta: number;
  batchData: any[];
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TelemetryBatchSchema = new Schema<ITelemetryBatch>({
  installId: {
    type: Schema.Types.ObjectId,
    ref: 'Install',
    required: true,
    index: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  segments: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    distance: { type: Number, required: true, min: 0 },
    rawDataCID: { type: String }
  }],
  totalDistance: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  segmentsCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  merkleRoot: {
    type: String,
    trim: true
  },
  arweaveTx: {
    type: String,
    trim: true
  },
  solanaTx: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'consolidating', 'anchored', 'error'],
    default: 'pending',
    index: true
  },
  lastError: {
    type: String
  },
  lastRecordedMileage: {
    type: Number,
    required: true,
    min: 0
  },
  distanceDelta: {
    type: Number,
    required: true,
    min: 0
  },
  batchData: [{
    type: Schema.Types.Mixed
  }],
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
TelemetryBatchSchema.index({ installId: 1, recordedAt: -1 });
TelemetryBatchSchema.index({ vehicleId: 1, recordedAt: -1 });
TelemetryBatchSchema.index({ deviceId: 1, recordedAt: -1 });
TelemetryBatchSchema.index({ vehicleId: 1, date: 1 }, { unique: true });
TelemetryBatchSchema.index({ status: 1 });
TelemetryBatchSchema.index({ arweaveTx: 1 }, { sparse: true });
TelemetryBatchSchema.index({ solanaTx: 1 }, { sparse: true });

export const TelemetryBatch = mongoose.model<ITelemetryBatch>('TelemetryBatch', TelemetryBatchSchema);