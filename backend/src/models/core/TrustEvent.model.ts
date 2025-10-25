import mongoose, { Schema, Document } from 'mongoose';

export interface ITrustEvent extends Document {
  vehicleId: mongoose.Types.ObjectId;
  change: number;
  previousScore: number;
  newScore: number;
  reason: string;
  details: {
    telemetryId?: mongoose.Types.ObjectId;
    installId?: mongoose.Types.ObjectId;
    solanaTx?: string;
    arweaveTx?: string;
    recordedBy?: mongoose.Types.ObjectId;
    reportedMileage?: number;
    previousMileage?: number;
    deviceId?: string;
    fraudAlertId?: mongoose.Types.ObjectId;
  };
  source: 'telemetry' | 'admin' | 'manual' | 'fraudEngine' | 'anchor';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TrustEventSchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  change: {
    type: Number,
    required: true
  },
  previousScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  newScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reason: {
    type: String,
    required: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  details: {
    telemetryId: {
      type: Schema.Types.ObjectId,
      ref: 'VehicleTelemetry'
    },
    installId: {
      type: Schema.Types.ObjectId,
      ref: 'InstallationRequest'
    },
    solanaTx: String,
    arweaveTx: String,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedMileage: Number,
    previousMileage: Number,
    deviceId: String,
    fraudAlertId: {
      type: Schema.Types.ObjectId,
      ref: 'FraudAlert'
    }
  },
  source: {
    type: String,
    enum: ['telemetry', 'admin', 'manual', 'fraudEngine', 'anchor'],
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'trust_events'
});

// Indexes for performance
TrustEventSchema.index({ vehicleId: 1, createdAt: -1 });
TrustEventSchema.index({ source: 1, createdAt: -1 });
TrustEventSchema.index({ change: 1 });

export const TrustEvent = mongoose.model<ITrustEvent>('TrustEvent', TrustEventSchema);
