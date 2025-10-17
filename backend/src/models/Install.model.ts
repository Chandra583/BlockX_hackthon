import mongoose, { Document, Schema } from 'mongoose';

export interface IInstall extends Document {
  vehicleId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  serviceProviderId?: mongoose.Types.ObjectId;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  deviceId?: string;
  requestedAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const InstallSchema = new Schema<IInstall>({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['requested', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  deviceId: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  assignedAt: Date,
  completedAt: Date,
  notes: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
InstallSchema.index({ vehicleId: 1 });
InstallSchema.index({ ownerId: 1 });
InstallSchema.index({ serviceProviderId: 1 });
InstallSchema.index({ status: 1 });
InstallSchema.index({ requestedAt: -1 });

export const Install = mongoose.model<IInstall>('Install', InstallSchema);