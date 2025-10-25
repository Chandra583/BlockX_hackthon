import { Router } from 'express';
import { TrustController } from '../../controllers/trust/trust.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Get trust history for a vehicle
router.get('/:vehicleId/history', authenticate, TrustController.getTrustHistory);

// Get specific trust event details
router.get('/:vehicleId/event/:eventId', authenticate, TrustController.getTrustEvent);

// Manual trust score adjustment (admin only)
router.post('/:vehicleId/manual-adjust', authenticate, TrustController.manualAdjust);

export default router;
