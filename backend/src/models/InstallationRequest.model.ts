import mongoose, { Document, Schema } from 'mongoose';

export interface IInstallationRequest extends Document {
  ownerId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId | string;
  serviceProviderId?: mongoose.Types.ObjectId;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  installedAt?: Date;
  history: Array<{
    action: string;
    by: mongoose.Types.ObjectId;
    at: Date;
    meta?: any;
  }>;
}

const InstallationRequestSchema = new Schema<IInstallationRequest>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  serviceProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['requested', 'assigned', 'completed', 'cancelled'],
    default: 'requested'
  },
  notes: String,
  installedAt: Date,
  history: [{
    action: {
      type: String,
      required: true
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    },
    meta: Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes
InstallationRequestSchema.index({ ownerId: 1 });
InstallationRequestSchema.index({ vehicleId: 1 });
InstallationRequestSchema.index({ status: 1 });
InstallationRequestSchema.index({ createdAt: -1 });

export const InstallationRequest = mongoose.model<IInstallationRequest>('InstallationRequest', InstallationRequestSchema);