import { apiService } from '../services/api';

/**
 * Purchase API Service
 * Handles all purchase flow related API calls
 */

export interface PurchaseRequest {
  _id: string;
  listingId: string;
  vehicleId: {
    _id: string;
    vin: string;
    vehicleNumber: string;
    make: string;
    vehicleModel: string;
    year: number;
    color: string;
    currentMileage: number;
    trustScore: number;
  };
  buyerId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    isLocked: boolean;
    id: string;
  };
  sellerId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    isLocked: boolean;
    id: string;
  };
  offeredPrice: number;
  status: 'pending_seller' | 'accepted' | 'rejected' | 'counter_offer' | 'escrow_pending' | 'escrow_funded' | 'verifying' | 'verification_passed' | 'verification_failed' | 'transfer_pending' | 'sold' | 'cancelled';
  counterPrice?: number;
  message?: string;
  escrowId?: string;
  verificationResults?: {
    telemetryCheck: boolean;
    trustScoreCheck: boolean;
    blockchainCheck: boolean;
    storageCheck: boolean;
    failureReasons?: string[];
    verifiedAt?: string;
  };
  messages: Array<{
    from: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    walletAddress?: string;
  };
}

export interface EscrowRecord {
  id: string;
  purchaseRequestId: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'refunded';
  paymentReference: string;
  metadata?: any;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  purchaseRequestId: string;
  listingId: string;
  vehicleId: string;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  solanaTxHash?: string;
  simulated: boolean;
  ownershipTransferredAt: string;
  metadata?: any;
  createdAt: string;
}

export interface OwnershipHistoryEntry {
  ownerUserId: string;
  ownerWallet?: string;
  fromDate: string;
  toDate?: string;
  txHash?: string;
  saleRecordId?: string;
  note?: string;
  explorerUrl?: string;
}

export interface OwnershipHistory {
  vehicleId: string;
  vin: string;
  currentOwner: string;
  ownershipHistory: OwnershipHistoryEntry[];
}

export class PurchaseAPI {
  
  /**
   * Get purchase requests for current user
   * GET /api/purchase/requests
   */
  static async getPurchaseRequests(params?: {
    role?: 'buyer' | 'seller';
    status?: string;
  }): Promise<{ success: boolean; data: PurchaseRequest[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);

      const response = await apiService.get<{ success: boolean; data: PurchaseRequest[] }>(
        `/purchase/requests?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch purchase requests:', error);
      throw error;
    }
  }

  /**
   * Seller responds to purchase request
   * POST /api/purchase/:requestId/respond
   */
  static async respondToRequest(
    requestId: string,
    action: 'accept' | 'reject' | 'counter',
    counterPrice?: number
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const body: any = { action };
      if (action === 'counter' && counterPrice) {
        body.counterPrice = counterPrice;
      }

      const response = await apiService.post<{ success: boolean; message: string; data: any }>(
        `/purchase/${requestId}/respond`,
        body
      );
      return response;
    } catch (error) {
      console.error('Failed to respond to purchase request:', error);
      throw error;
    }
  }

  /**
   * Buyer funds escrow (mock payment)
   * POST /api/purchase/:requestId/mockFund
   */
  static async mockFundEscrow(
    requestId: string,
    amount: number,
    paymentRef?: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean; message: string; data: EscrowRecord }> {
    try {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }

      const response = await apiService.post<{ success: boolean; message: string; data: EscrowRecord }>(
        `/purchase/${requestId}/mockFund`,
        { amount, paymentRef },
        { headers }
      );
      return response;
    } catch (error) {
      console.error('Failed to fund escrow:', error);
      throw error;
    }
  }

  /**
   * Run verification checks
   * POST /api/purchase/:requestId/verify
   */
  static async verifyPurchase(
    requestId: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(
        `/purchase/${requestId}/verify`
      );
      return response;
    } catch (error) {
      console.error('Failed to verify purchase:', error);
      throw error;
    }
  }

  /**
   * Seller initiates transfer
   * POST /api/purchase/:requestId/initTransfer
   */
  static async initTransfer(
    requestId: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(
        `/purchase/${requestId}/initTransfer`
      );
      return response;
    } catch (error) {
      console.error('Failed to initiate transfer:', error);
      throw error;
    }
  }

  /**
   * Seller confirms transfer (creates Solana tx and updates ownership)
   * POST /api/purchase/:requestId/confirmTransfer
   */
  static async confirmTransfer(
    requestId: string
  ): Promise<{ success: boolean; message: string; data: SaleRecord }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: SaleRecord }>(
        `/purchase/${requestId}/confirmTransfer`
      );
      return response;
    } catch (error) {
      console.error('Failed to confirm transfer:', error);
      throw error;
    }
  }

  /**
   * Get ownership history for a vehicle
   * GET /api/vehicle/:vehicleId/ownership-history
   */
  static async getOwnershipHistory(
    vehicleId: string
  ): Promise<{ success: boolean; data: OwnershipHistory }> {
    try {
      const response = await apiService.get<{ success: boolean; data: OwnershipHistory }>(
        `/vehicle/${vehicleId}/ownership-history`
      );
      return response;
    } catch (error) {
      console.error('Failed to get ownership history:', error);
      throw error;
    }
  }
}

export default PurchaseAPI;
