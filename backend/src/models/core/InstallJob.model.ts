import mongoose, { Schema, Document, Model } from 'mongoose';

export type InstallJobStatus =
  | 'requested'
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IInstallJobDocument extends Document {
  deviceId: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  assignedProviderId?: mongoose.Types.ObjectId;
  status: InstallJobStatus;
  requestedAt: Date;
  assignedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  notes?: string;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InstallJobSchema = new Schema<IInstallJobDocument>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedProviderId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: ['requested', 'assigned', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'],
      default: 'requested',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String, maxlength: 1000 },
    location: {
      address: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { timestamps: true }
);

InstallJobSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
InstallJobSchema.index({ assignedProviderId: 1, status: 1 });

const InstallJob: Model<IInstallJobDocument> =
  mongoose.models.InstallJob || mongoose.model<IInstallJobDocument>('InstallJob', InstallJobSchema);

export default InstallJob;
export { InstallJob };

