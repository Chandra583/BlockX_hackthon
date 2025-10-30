import mongoose, { Schema, Document, Model } from 'mongoose';

// Vehicle Blockchain History Document Interface
export interface IVehicleBlockchainHistory extends Document {
  vehicleId: mongoose.Types.ObjectId;
  transactionType: 'registration' | 'device_install' | 'owner_transfer' | 'mileage_update' | 'service_record';
  transactionHash: string;
  blockchainAddress: string; // Wallet address that signed the transaction
  network: 'devnet' | 'testnet' | 'mainnet';
  metadata: {
    deviceId?: string;
    previousOwner?: string;
    newOwner?: string;
    ownerName?: string;
    serviceProviderName?: string;
    mileage?: number;
    vehicleNumber?: string;
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
    [key: string]: any; // Flexible for future fields
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle Blockchain History Schema
const VehicleBlockchainHistorySchema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },
  transactionType: {
    type: String,
    enum: ['registration', 'device_install', 'owner_transfer', 'mileage_update', 'service_record'],
    required: [true, 'Transaction type is required'],
    index: true
  },
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    unique: true
  },
  blockchainAddress: {
    type: String,
    required: [true, 'Blockchain address is required'],
    index: true
  },
  network: {
    type: String,
    enum: ['devnet', 'testnet', 'mainnet'],
    default: 'devnet',
    required: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'vehicle_blockchain_history'
});

// Compound Indexes for efficient queries
VehicleBlockchainHistorySchema.index({ vehicleId: 1, timestamp: -1 });
VehicleBlockchainHistorySchema.index({ vehicleId: 1, transactionType: 1 });

// Static Methods
VehicleBlockchainHistorySchema.statics.findByVehicle = function(vehicleId: string) {
  return this.find({ vehicleId }).sort({ timestamp: -1 });
};

VehicleBlockchainHistorySchema.statics.findByType = function(vehicleId: string, transactionType: string) {
  return this.find({ vehicleId, transactionType }).sort({ timestamp: -1 });
};

VehicleBlockchainHistorySchema.statics.getLatestByType = function(vehicleId: string, transactionType: string) {
  return this.findOne({ vehicleId, transactionType }).sort({ timestamp: -1 });
};

// Create and export the model
const VehicleBlockchainHistory: Model<IVehicleBlockchainHistory> = mongoose.model<IVehicleBlockchainHistory>(
  'VehicleBlockchainHistory',
  VehicleBlockchainHistorySchema
);

export default VehicleBlockchainHistory;

