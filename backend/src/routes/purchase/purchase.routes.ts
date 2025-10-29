import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { PurchaseController } from '../../controllers/purchase/purchase.controller';

const router = Router();

/**
 * Purchase Flow Routes
 * Handles vehicle purchase requests, escrow, verification, and ownership transfer
 */

// Get user's purchase requests (buyer or seller)
router.get('/requests', authenticate, PurchaseController.getPurchaseRequests);

// Seller responds to purchase request (accept/reject/counter)
router.post('/:requestId/respond', authenticate, PurchaseController.respondToPurchaseRequest);

// Buyer funds escrow (mock payment)
router.post('/:requestId/mockFund', authenticate, PurchaseController.mockFundEscrow);

// Run verification checks
router.post('/:requestId/verify', authenticate, PurchaseController.verifyPurchase);

// Seller initiates transfer (optional step)
router.post('/:requestId/initTransfer', authenticate, PurchaseController.initTransfer);

// Seller confirms transfer (creates Solana tx and updates ownership)
router.post('/:requestId/confirmTransfer', authenticate, PurchaseController.confirmTransfer);

export default router;

