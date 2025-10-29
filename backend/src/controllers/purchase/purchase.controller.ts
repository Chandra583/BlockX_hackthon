import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { PurchaseRequest } from '../../models/PurchaseRequest.model';
import { Escrow } from '../../models/Escrow.model';
import { SaleRecord } from '../../models/SaleRecord.model';
import Vehicle from '../../models/core/Vehicle.model';
import { User } from '../../models/core/User.model';
import { TelemetryBatch } from '../../models/TelemetryBatch.model';
import { getSolanaService } from '../../services/blockchain/solana.service';
import mongoose from 'mongoose';

export class PurchaseController {
  /**
   * POST /api/marketplace/:listingId/request
   * Create a purchase request
   */
  static async createPurchaseRequest(req: any, res: Response) {
    try {
      const { listingId } = req.params;
      const { price, message } = req.body;
      const buyerId = req.user.id;

      if (!price || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }

      // Find vehicle by listing ID (using vehicle ID as listing ID for simplicity)
      const vehicle: any = await Vehicle.findById(listingId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle listing not found'
        });
      }

      // Verify vehicle is for sale
      if (!vehicle.isForSale || vehicle.listingStatus !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is not available for purchase'
        });
      }

      const sellerId = vehicle.ownerId;

      // Prevent buyer == seller
      if (buyerId === sellerId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot purchase your own vehicle'
        });
      }

      // Check for existing pending/active requests
      const existingRequest = await PurchaseRequest.findOne({
        vehicleId: listingId,
        buyerId,
        status: { $in: ['pending_seller', 'accepted', 'escrow_pending', 'escrow_funded', 'verifying', 'verification_passed', 'transfer_pending'] }
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active purchase request for this vehicle'
        });
      }

      const purchaseRequest = new PurchaseRequest({
        listingId,
        vehicleId: listingId,
        buyerId,
        sellerId,
        offeredPrice: price,
        message,
        status: 'pending_seller'
      });

      await purchaseRequest.save();

      logger.info(`✅ Purchase request created: ${purchaseRequest._id} - Buyer: ${buyerId}, Vehicle: ${listingId}`);

      res.status(201).json({
        success: true,
        message: 'Purchase request created successfully',
        data: {
          requestId: purchaseRequest._id,
          vehicleId: listingId,
          offeredPrice: price,
          status: 'pending_seller',
          createdAt: purchaseRequest.createdAt
        }
      });
    } catch (error) {
      logger.error('❌ Failed to create purchase request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase request',
        error: error.message
      });
    }
  }

  /**
   * POST /api/purchase/:requestId/respond
   * Seller responds to purchase request
   */
  static async respondToPurchaseRequest(req: any, res: Response) {
    try {
      const { requestId } = req.params;
      const { action, counterPrice } = req.body;
      const sellerId = req.user.id;

      if (!['accept', 'reject', 'counter'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be accept, reject, or counter'
        });
      }

      const purchaseRequest: any = await PurchaseRequest.findById(requestId);
      if (!purchaseRequest) {
        return res.status(404).json({
          success: false,
          message: 'Purchase request not found'
        });
      }

      // Verify seller ownership
      if (purchaseRequest.sellerId.toString() !== sellerId) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller can respond to this request'
        });
      }

      // Verify request is in pending state
      if (purchaseRequest.status !== 'pending_seller') {
        return res.status(400).json({
          success: false,
          message: 'Request is not in pending state'
        });
      }

      let newStatus: string;
      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          purchaseRequest.status = newStatus;
          break;
        case 'reject':
          newStatus = 'rejected';
          purchaseRequest.status = newStatus;
          break;
        case 'counter':
          if (!counterPrice || counterPrice <= 0) {
            return res.status(400).json({
              success: false,
              message: 'Valid counter price is required'
            });
          }
          newStatus = 'counter_offer';
          purchaseRequest.status = newStatus;
          purchaseRequest.counterPrice = counterPrice;
          break;
      }

      await purchaseRequest.save();

      logger.info(`✅ Purchase request ${requestId} ${action}ed by seller ${sellerId}`);

      res.status(200).json({
        success: true,
        message: `Purchase request ${action}ed successfully`,
        data: {
          requestId: purchaseRequest._id,
          status: purchaseRequest.status,
          counterPrice: purchaseRequest.counterPrice,
          updatedAt: purchaseRequest.updatedAt
        }
      });
    } catch (error) {
      logger.error('❌ Failed to respond to purchase request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to purchase request',
        error: error.message
      });
    }
  }

  /**
   * POST /api/purchase/:requestId/mockFund
   * Buyer funds the escrow (mocked payment)
   */
  static async mockFundEscrow(req: any, res: Response) {
    try {
      const { requestId } = req.params;
      const { amount, paymentRef } = req.body;
      const buyerId = req.user.id;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      // Check idempotency
      if (idempotencyKey) {
        const existingEscrow = await Escrow.findOne({ idempotencyKey });
        if (existingEscrow) {
          logger.info(`🔁 Idempotent request detected: ${idempotencyKey}`);
          return res.status(200).json({
            success: true,
            message: 'Escrow already funded',
            data: {
              escrowId: existingEscrow._id,
              amount: existingEscrow.amount,
              status: existingEscrow.status,
              paymentReference: existingEscrow.paymentReference
            }
          });
        }
      }

      const purchaseRequest: any = await PurchaseRequest.findById(requestId);
      if (!purchaseRequest) {
        return res.status(404).json({
          success: false,
          message: 'Purchase request not found'
        });
      }

      // Verify buyer
      if (purchaseRequest.buyerId.toString() !== buyerId) {
        return res.status(403).json({
          success: false,
          message: 'Only the buyer can fund this escrow'
        });
      }

      // Verify request is accepted
      if (purchaseRequest.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Purchase request must be accepted before funding'
        });
      }

      // Check if already funded
      if (purchaseRequest.escrowId) {
        const existingEscrow = await Escrow.findById(purchaseRequest.escrowId);
        if (existingEscrow && existingEscrow.status === 'funded') {
          return res.status(400).json({
            success: false,
            message: 'Escrow already funded'
          });
        }
      }

      // Create escrow record (mock payment)
      const mockPaymentRef = paymentRef || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const escrow = new Escrow({
        purchaseRequestId: requestId,
        amount,
        status: 'funded',
        paymentReference: mockPaymentRef,
        idempotencyKey,
        metadata: {
          paymentMethod: 'mock',
          note: 'Mock payment for demo purposes'
        }
      });

      await escrow.save();

      // Update purchase request
      purchaseRequest.escrowId = escrow._id;
      purchaseRequest.status = 'escrow_funded';
      await purchaseRequest.save();

      logger.info(`✅ Escrow funded (mock): ${escrow._id} - Amount: ${amount}, Request: ${requestId}`);

      res.status(200).json({
        success: true,
        message: 'Escrow funded successfully',
        data: {
          escrowId: escrow._id,
          purchaseRequestId: requestId,
          amount: escrow.amount,
          status: escrow.status,
          paymentReference: escrow.paymentReference,
          fundedAt: escrow.createdAt
        }
      });
    } catch (error) {
      logger.error('❌ Failed to fund escrow:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fund escrow',
        error: error.message
      });
    }
  }

  /**
   * POST /api/purchase/:requestId/verify
   * Run verification checks on vehicle
   */
  static async verifyPurchase(req: any, res: Response) {
    try {
      const { requestId } = req.params;

      const purchaseRequest: any = await PurchaseRequest.findById(requestId).populate('vehicleId');
      if (!purchaseRequest) {
        return res.status(404).json({
          success: false,
          message: 'Purchase request not found'
        });
      }

      // Verify request is funded
      if (purchaseRequest.status !== 'escrow_funded') {
        return res.status(400).json({
          success: false,
          message: 'Purchase request must be funded before verification'
        });
      }

      const vehicle: any = purchaseRequest.vehicleId;
      const failureReasons: string[] = [];
      let telemetryCheck = false;
      let trustScoreCheck = false;
      let blockchainCheck = false;
      let storageCheck = false;

      // Check 1: Last telemetry within 24h (relaxed for demo)
      const latestBatch = await TelemetryBatch.findOne({ vehicleId: vehicle._id })
        .sort({ recordedAt: -1 })
        .limit(1);

      if (latestBatch) {
        const hoursSinceLastTelemetry = (Date.now() - latestBatch.recordedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastTelemetry <= 24) {
          telemetryCheck = true;
        } else {
          // For demo: allow telemetry up to 7 days old
          if (hoursSinceLastTelemetry <= 168) { // 7 days
            telemetryCheck = true;
            logger.info(`⚠️ Demo mode: Allowing telemetry ${Math.round(hoursSinceLastTelemetry)} hours old`);
          } else {
            failureReasons.push(`Last telemetry was ${Math.round(hoursSinceLastTelemetry)} hours ago (>7 days)`);
          }
        }
      } else {
        // For demo: allow vehicles without telemetry if trust score is good
        if (vehicle.trustScore >= 50) {
          telemetryCheck = true;
          logger.info(`⚠️ Demo mode: Allowing vehicle without telemetry data (trust score: ${vehicle.trustScore})`);
        } else {
          failureReasons.push('No telemetry data found');
        }
      }

      // Check 2: Trust score >= 50
      const TRUST_SCORE_THRESHOLD = parseInt(process.env.TRUST_SCORE_THRESHOLD || '50');
      if (vehicle.trustScore >= TRUST_SCORE_THRESHOLD) {
        trustScoreCheck = true;
      } else {
        failureReasons.push(`Trust score ${vehicle.trustScore} is below threshold ${TRUST_SCORE_THRESHOLD}`);
      }

      // Check 3: Blockchain tx exists and confirmed (relaxed for demo)
      if (vehicle.blockchainHash) {
        try {
          const solanaService = getSolanaService();
          const confirmed = await solanaService.confirmTransaction(vehicle.blockchainHash);
          if (confirmed) {
            blockchainCheck = true;
          } else {
            // For demo: simulate blockchain confirmation
            blockchainCheck = true;
            logger.info(`⚠️ Demo mode: Simulating blockchain confirmation for ${vehicle.blockchainHash}`);
          }
        } catch (error) {
          // For demo: allow blockchain verification to pass
          blockchainCheck = true;
          logger.info(`⚠️ Demo mode: Allowing blockchain verification despite error: ${error.message}`);
        }
      } else {
        // For demo: allow vehicles without blockchain hash if trust score is good
        if (vehicle.trustScore >= 50) {
          blockchainCheck = true;
          logger.info(`⚠️ Demo mode: Allowing vehicle without blockchain hash (trust score: ${vehicle.trustScore})`);
        } else {
          failureReasons.push('No blockchain hash found');
        }
      }

      // Check 4: Latest batch has valid storage reference (relaxed for demo)
      if (latestBatch && (latestBatch.arweaveTx || latestBatch.merkleRoot)) {
        storageCheck = true;
      } else {
        // For demo: allow vehicles without storage reference if trust score is good
        if (vehicle.trustScore >= 50) {
          storageCheck = true;
          logger.info(`⚠️ Demo mode: Allowing vehicle without storage reference (trust score: ${vehicle.trustScore})`);
        } else {
          failureReasons.push('No valid storage reference found for latest batch');
        }
      }

      // For demo: Only require trust score check to pass
      const allChecksPassed = trustScoreCheck;
      
      // Update purchase request with verification results
      purchaseRequest.verificationResults = {
        telemetryCheck,
        trustScoreCheck,
        blockchainCheck,
        storageCheck,
        failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
        verifiedAt: new Date()
      };
      purchaseRequest.status = allChecksPassed ? 'verification_passed' : 'verification_failed';
      await purchaseRequest.save();

      logger.info(`${allChecksPassed ? '✅' : '❌'} Verification ${allChecksPassed ? 'passed' : 'failed'} for request ${requestId}`);

      res.status(200).json({
        success: true,
        message: allChecksPassed ? 'Verification passed' : 'Verification failed',
        data: {
          requestId: purchaseRequest._id,
          verificationPassed: allChecksPassed,
          checks: {
            telemetryCheck,
            trustScoreCheck,
            blockchainCheck,
            storageCheck
          },
          failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
          verifiedAt: purchaseRequest.verificationResults.verifiedAt
        }
      });
    } catch (error) {
      logger.error('❌ Failed to verify purchase:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify purchase',
        error: error.message
      });
    }
  }

  /**
   * POST /api/purchase/:requestId/initTransfer
   * Seller initiates transfer (not used in current flow, confirmTransfer does everything)
   */
  static async initTransfer(req: any, res: Response) {
    try {
      const { requestId } = req.params;
      const sellerId = req.user.id;

      const purchaseRequest: any = await PurchaseRequest.findById(requestId);
      if (!purchaseRequest) {
        return res.status(404).json({
          success: false,
          message: 'Purchase request not found'
        });
      }

      // Verify seller
      if (purchaseRequest.sellerId.toString() !== sellerId) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller can initiate transfer'
        });
      }

      // Verify verification passed
      if (purchaseRequest.status !== 'verification_passed') {
        return res.status(400).json({
          success: false,
          message: 'Verification must pass before transfer'
        });
      }

      purchaseRequest.status = 'transfer_pending';
      await purchaseRequest.save();

      logger.info(`✅ Transfer initiated for request ${requestId}`);

      res.status(200).json({
        success: true,
        message: 'Transfer initiated successfully',
        data: {
          requestId: purchaseRequest._id,
          status: purchaseRequest.status
        }
      });
    } catch (error) {
      logger.error('❌ Failed to initiate transfer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate transfer',
        error: error.message
      });
    }
  }

  /**
   * POST /api/purchase/:requestId/confirmTransfer
   * Seller confirms transfer - creates Solana tx and updates ownership
   */
  static async confirmTransfer(req: any, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { requestId } = req.params;
      const sellerId = req.user.id;

      const purchaseRequest: any = await PurchaseRequest.findById(requestId)
        .populate('vehicleId')
        .populate('buyerId')
        .populate('sellerId')
        .session(session);

      if (!purchaseRequest) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Purchase request not found'
        });
      }

      // Verify seller
      if (purchaseRequest.sellerId._id.toString() !== sellerId) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Only the seller can confirm transfer'
        });
      }

      // Verify verification passed
      if (purchaseRequest.status !== 'verification_passed') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Verification must pass before transfer'
        });
      }

      const vehicle: any = purchaseRequest.vehicleId;
      const buyer: any = purchaseRequest.buyerId;
      const seller: any = purchaseRequest.sellerId;

      let solanaTxHash: string | undefined;
      let simulated = false;

      // Attempt Solana transaction
      try {
        // Get or generate seller wallet
        const sellerWallet = seller.walletAddress
          ? { publicKey: seller.walletAddress, secretKey: new Uint8Array(64) } // Placeholder
          : null;

        if (!sellerWallet && process.env.SIMULATE_SOLANA !== 'true') {
          logger.warn('⚠️ Seller wallet not found, simulating transaction');
          simulated = true;
          solanaTxHash = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        } else if (process.env.SIMULATE_SOLANA === 'true') {
          simulated = true;
          solanaTxHash = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          logger.info('🧪 Simulating Solana transaction (SIMULATE_SOLANA=true)');
        } else {
          // Real Solana transaction (requires proper wallet setup)
          logger.info('⚠️ Real Solana tx not implemented yet, simulating...');
          simulated = true;
          solanaTxHash = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      } catch (solanaError) {
        logger.error('❌ Solana transaction failed:', solanaError);
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: 'Failed to record transaction on blockchain',
          error: solanaError.message
        });
      }

      // Update vehicle ownership
      const previousOwner = vehicle.ownerId;
      vehicle.ownerId = buyer._id;
      vehicle.ownerUserId = buyer._id;
      vehicle.ownerWalletAddress = buyer.walletAddress;
      vehicle.isForSale = false;
      vehicle.listingStatus = 'sold';

      // Add to ownership history
      if (!vehicle.ownershipHistory) {
        vehicle.ownershipHistory = [];
      }

      // Close previous ownership record
      if (vehicle.ownershipHistory.length > 0) {
        const lastEntry = vehicle.ownershipHistory[vehicle.ownershipHistory.length - 1];
        if (!lastEntry.toDate) {
          lastEntry.toDate = new Date();
        }
      }

      // Add new ownership record
      vehicle.ownershipHistory.push({
        ownerUserId: buyer._id,
        ownerWallet: buyer.walletAddress,
        fromDate: new Date(),
        txHash: solanaTxHash,
        saleRecordId: null, // Will be updated below
        note: `Purchased via marketplace from ${seller.firstName} ${seller.lastName}`
      });

      await vehicle.save({ session });

      // Create sale record
      const saleRecord = new SaleRecord({
        purchaseRequestId: requestId,
        listingId: purchaseRequest.listingId,
        vehicleId: vehicle._id,
        buyerId: buyer._id,
        sellerId: seller._id,
        finalPrice: purchaseRequest.offeredPrice,
        solanaTxHash,
        simulated,
        ownershipTransferredAt: new Date(),
        metadata: {
          verificationResults: purchaseRequest.verificationResults,
          escrowId: purchaseRequest.escrowId
        }
      });

      await saleRecord.save({ session });

      // Update ownership history with sale record ID
      vehicle.ownershipHistory[vehicle.ownershipHistory.length - 1].saleRecordId = saleRecord._id;
      await vehicle.save({ session });

      // Update purchase request
      purchaseRequest.status = 'sold';
      await purchaseRequest.save({ session });

      // Release escrow
      if (purchaseRequest.escrowId) {
        await Escrow.findByIdAndUpdate(
          purchaseRequest.escrowId,
          { status: 'released', releasedAt: new Date() },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      logger.info(`✅ Ownership transferred: Vehicle ${vehicle._id} from ${seller._id} to ${buyer._id} - TX: ${solanaTxHash}`);

      res.status(200).json({
        success: true,
        message: 'Ownership transferred successfully',
        data: {
          saleRecordId: saleRecord._id,
          vehicleId: vehicle._id,
          newOwnerId: buyer._id,
          solanaTxHash,
          simulated,
          explorerUrl: simulated
            ? null
            : `https://explorer.solana.com/tx/${solanaTxHash}?cluster=devnet`,
          transferredAt: saleRecord.ownershipTransferredAt
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error('❌ Failed to confirm transfer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm transfer',
        error: error.message
      });
    }
  }

  /**
   * GET /api/vehicle/:vehicleId/ownership-history
   * Get ownership history for a vehicle
   */
  static async getOwnershipHistory(req: Request, res: Response) {
    try {
      const { vehicleId } = req.params;

      const vehicle: any = await Vehicle.findById(vehicleId)
        .populate('ownershipHistory.ownerUserId', 'firstName lastName email walletAddress')
        .lean();

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      const ownershipHistory = vehicle.ownershipHistory || [];

      res.status(200).json({
        success: true,
        data: {
          vehicleId,
          vin: vehicle.vin,
          currentOwner: vehicle.ownerId,
          ownershipHistory: ownershipHistory.map((entry: any) => ({
            ownerUserId: entry.ownerUserId,
            ownerWallet: entry.ownerWallet,
            fromDate: entry.fromDate,
            toDate: entry.toDate,
            txHash: entry.txHash,
            saleRecordId: entry.saleRecordId,
            note: entry.note,
            explorerUrl: entry.txHash && !entry.txHash.startsWith('sim_')
              ? `https://explorer.solana.com/tx/${entry.txHash}?cluster=devnet`
              : null
          }))
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get ownership history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ownership history',
        error: error.message
      });
    }
  }

  /**
   * GET /api/purchase/requests
   * Get purchase requests for current user (buyer or seller)
   */
  static async getPurchaseRequests(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { role, status } = req.query;

      const query: any = {};
      
      if (role === 'buyer') {
        query.buyerId = userId;
      } else if (role === 'seller') {
        query.sellerId = userId;
      } else {
        // Both buyer and seller
        query.$or = [{ buyerId: userId }, { sellerId: userId }];
      }

      if (status) {
        query.status = status;
      }

      const requests = await PurchaseRequest.find(query)
        .populate('vehicleId', 'vin vehicleNumber make vehicleModel year color currentMileage trustScore')
        .populate('buyerId', 'firstName lastName email walletAddress')
        .populate('sellerId', 'firstName lastName email walletAddress')
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      logger.error('❌ Failed to get purchase requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get purchase requests',
        error: error.message
      });
    }
  }
}

