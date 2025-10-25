import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudAlert extends Document {
  vehicleId: mongoose.Types.ObjectId;
  telemetryId?: mongoose.Types.ObjectId;
  alertType: 'odometer_rollback' | 'title_washing' | 'duplicate_vin' | 'stolen_vehicle' | 'flood_damage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedBy?: mongoose.Types.ObjectId;
  reportedAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  evidence: string[];
  investigationNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FraudAlertSchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  telemetryId: {
    type: Schema.Types.ObjectId,
    ref: 'VehicleTelemetry',
    index: true
  },
  alertType: {
    type: String,
    enum: ['odometer_rollback', 'title_washing', 'duplicate_vin', 'stolen_vehicle', 'flood_damage', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_positive'],
    default: 'active'
  },
  evidence: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Evidence must be a valid URL'
    }
  }],
  investigationNotes: {
    type: String,
    maxlength: [2000, 'Investigation notes cannot exceed 2000 characters']
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'fraud_alerts'
});

// Indexes for performance
FraudAlertSchema.index({ vehicleId: 1, status: 1 });
FraudAlertSchema.index({ alertType: 1, severity: 1 });
FraudAlertSchema.index({ reportedAt: -1 });

export const FraudAlert = mongoose.model<IFraudAlert>('FraudAlert', FraudAlertSchema);
