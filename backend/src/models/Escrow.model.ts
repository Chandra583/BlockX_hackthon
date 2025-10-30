import mongoose, { Document, Schema } from 'mongoose';

export interface IEscrow extends Document {
  purchaseRequestId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'refunded';
  paymentReference: string;
  idempotencyKey?: string;
  metadata?: {
    paymentMethod?: string;
    transactionId?: string;
    [key: string]: any;
  };
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EscrowSchema = new Schema<IEscrow>({
  purchaseRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseRequest',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'funded', 'released', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  releasedAt: Date
}, {
  timestamps: true
});

// Indexes
EscrowSchema.index({ purchaseRequestId: 1, status: 1 });
EscrowSchema.index({ paymentReference: 1 });

export const Escrow = mongoose.model<IEscrow>('Escrow', EscrowSchema);


