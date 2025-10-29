import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleRecord extends Document {
  purchaseRequestId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  finalPrice: number;
  solanaTxHash?: string;
  simulated: boolean;
  ownershipTransferredAt: Date;
  metadata?: {
    verificationResults?: any;
    escrowId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  createdAt: Date;
}

const SaleRecordSchema = new Schema<ISaleRecord>({
  purchaseRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseRequest',
    required: true,
    unique: true
  },
  listingId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  solanaTxHash: {
    type: String,
    index: true
  },
  simulated: {
    type: Boolean,
    default: false
  },
  ownershipTransferredAt: {
    type: Date,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
SaleRecordSchema.index({ vehicleId: 1, createdAt: -1 });
SaleRecordSchema.index({ buyerId: 1, createdAt: -1 });
SaleRecordSchema.index({ sellerId: 1, createdAt: -1 });

export const SaleRecord = mongoose.model<ISaleRecord>('SaleRecord', SaleRecordSchema);

