export interface VehicleBlockchainTransaction {
  id: string;
  type: 'registration' | 'device_install' | 'owner_transfer' | 'mileage_update' | 'service_record';
  hash: string;
  blockchainAddress: string;
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
    [key: string]: any;
  };
  timestamp: string;
  explorerUrl: string;
}

export interface BlockchainHistoryResponse {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    transactions: VehicleBlockchainTransaction[];
    total: number;
  };
}

export interface SingleTransactionResponse {
  success: boolean;
  message: string;
  data: VehicleBlockchainTransaction;
}
