import { Router } from 'express';
import { TrustController } from '../../controllers/trust/trust.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Get user trust score
router.get('/user-score/:userId', authenticate, TrustController.getUserTrustScore);

// Get trust history for a vehicle
router.get('/:vehicleId/history', authenticate, TrustController.getTrustHistory);

// Get specific trust event details
router.get('/:vehicleId/event/:eventId', authenticate, TrustController.getTrustEvent);

// Get vehicle trust score
router.get('/:vehicleId/score', authenticate, TrustController.getVehicleTrustScore);

// Seed initial trust score (admin only)
router.post('/:vehicleId/seed', authenticate, TrustController.seedTrustScore);

// Manual trust score adjustment (admin only)
router.post('/:vehicleId/manual-adjust', authenticate, TrustController.manualAdjust);

export default router;
