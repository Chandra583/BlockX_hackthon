import mongoose, { Document, Schema } from 'mongoose';

export interface ITelemetryBatch extends Document {
  installId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  deviceId: string;
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

export const TelemetryBatch = mongoose.model<ITelemetryBatch>('TelemetryBatch', TelemetryBatchSchema);