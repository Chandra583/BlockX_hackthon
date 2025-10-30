import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseRequest extends Document {
  listingId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  offeredPrice: number;
  status: 'pending_seller' | 'accepted' | 'rejected' | 'counter_offer' | 'escrow_pending' | 'escrow_funded' | 'verifying' | 'verification_passed' | 'verification_failed' | 'transfer_pending' | 'sold' | 'cancelled';
  counterPrice?: number;
  message?: string;
  escrowId?: mongoose.Types.ObjectId;
  verificationResults?: {
    telemetryCheck: boolean;
    trustScoreCheck: boolean;
    blockchainCheck: boolean;
    storageCheck: boolean;
    failureReasons?: string[];
    verifiedAt?: Date;
  };
  messages: Array<{
    from: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequestSchema = new Schema<IPurchaseRequest>({
  listingId: {
    type: Schema.Types.ObjectId,
    required: true,
    // Indexed via schema.index below
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    // Indexed via schema.index below
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // Indexed via schema.index below
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // Indexed via schema.index below
  },
  offeredPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending_seller', 'accepted', 'rejected', 'counter_offer', 'escrow_pending', 'escrow_funded', 'verifying', 'verification_passed', 'verification_failed', 'transfer_pending', 'sold', 'cancelled'],
    default: 'pending_seller'
  },
  counterPrice: {
    type: Number,
    min: 0
  },
  message: {
    type: String,
    maxlength: 1000
  },
  escrowId: {
    type: Schema.Types.ObjectId,
    ref: 'Escrow'
  },
  verificationResults: {
    telemetryCheck: Boolean,
    trustScoreCheck: Boolean,
    blockchainCheck: Boolean,
    storageCheck: Boolean,
    failureReasons: [String],
    verifiedAt: Date
  },
  messages: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
PurchaseRequestSchema.index({ buyerId: 1, status: 1 });
PurchaseRequestSchema.index({ sellerId: 1, status: 1 });
PurchaseRequestSchema.index({ listingId: 1, status: 1 });

export const PurchaseRequest = mongoose.model<IPurchaseRequest>('PurchaseRequest', PurchaseRequestSchema);


