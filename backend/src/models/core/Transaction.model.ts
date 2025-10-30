import mongoose, { Schema, Document, Model } from 'mongoose';

// Transaction Document Interface
export interface ITransactionDocument extends Document {
  transactionHash: string;
  userId: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  type: 'vehicle_registration' | 'mileage_update' | 'document_upload' | 'fraud_alert' | 'service_record';
  status: 'pending' | 'confirmed' | 'failed' | 'rejected';
  blockchain: 'solana' | 'ethereum' | 'arweave';
  network: 'mainnet' | 'devnet' | 'testnet';
  blockNumber?: number;
  blockTime?: Date;
  gasUsed?: number;
  gasPrice?: number;
  fromAddress: string;
  toAddress?: string;
  value?: number;
  data: any; // Transaction-specific data
  metadata?: {
    vehicleVin?: string;
    mileage?: number;
    previousMileage?: number;
    documentType?: string;
    fraudCheck?: any;
    serviceType?: string;
  };
  explorerUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Schema
const TransactionSchema = new Schema({
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  type: {
    type: String,
    enum: ['vehicle_registration', 'mileage_update', 'document_upload', 'fraud_alert', 'service_record'],
    required: [true, 'Transaction type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'rejected'],
    default: 'pending',
    required: true
  },
  blockchain: {
    type: String,
    enum: ['solana', 'ethereum', 'arweave'],
    required: [true, 'Blockchain is required']
  },
  network: {
    type: String,
    enum: ['mainnet', 'devnet', 'testnet'],
    required: [true, 'Network is required']
  },
  blockNumber: {
    type: Number
  },
  blockTime: {
    type: Date
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: Number
  },
  fromAddress: {
    type: String,
    required: [true, 'From address is required']
  },
  toAddress: {
    type: String
  },
  value: {
    type: Number,
    min: [0, 'Value cannot be negative']
  },
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Transaction data is required']
  },
  metadata: {
    vehicleVin: {
      type: String,
      uppercase: true
    },
    mileage: {
      type: Number,
      min: [0, 'Mileage cannot be negative']
    },
    previousMileage: {
      type: Number,
      min: [0, 'Previous mileage cannot be negative']
    },
    documentType: {
      type: String
    },
    fraudCheck: {
      isFraud: Boolean,
      riskLevel: String,
      reasons: [String]
    },
    serviceType: {
      type: String
    }
  },
  explorerUrl: {
    type: String,
    required: [true, 'Explorer URL is required']
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Indexes for performance
TransactionSchema.index({ transactionHash: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ vehicleId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ blockchain: 1, network: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ 'metadata.vehicleVin': 1 });

// Static Methods
TransactionSchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('vehicleId', 'vin make vehicleModel year')
    .populate('userId', 'firstName lastName email');
};

TransactionSchema.statics.findByVehicle = function(vehicleId: string, limit: number = 50) {
  return this.find({ vehicleId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email');
};

TransactionSchema.statics.findByHash = function(transactionHash: string) {
  return this.findOne({ transactionHash });
};

TransactionSchema.statics.getTransactionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status',
          blockchain: '$blockchain'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.blockchain',
        transactions: {
          $push: {
            type: '$_id.type',
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

// Pre-save middleware
TransactionSchema.pre('save', function(next) {
  if (this.metadata && this.metadata.vehicleVin) {
    this.metadata.vehicleVin = this.metadata.vehicleVin.toUpperCase();
  }
  next();
});

// Create and export the model
const Transaction: Model<ITransactionDocument> = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

export default Transaction;
