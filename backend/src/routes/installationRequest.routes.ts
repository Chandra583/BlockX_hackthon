import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as installationController from '../controllers/installationRequest.controller';

const router = Router();

// Apply authentication to all installation request routes
router.use(authenticate);

/**
 * POST /api/v1/installation-requests
 * Create a new installation request
 * Access: All authenticated users
 */
router.post('/', installationController.createInstallationRequest);

/**
 * GET /api/v1/installation-requests
 * Get installation requests with filters
 * Access: All authenticated users (with role-based filtering)
 */
router.get('/', installationController.getInstallationRequests);

/**
 * GET /api/v1/installation-requests/summary
 * Get installation request summary for owner's vehicles
 * Access: All authenticated users (with role-based filtering)
 */
router.get('/summary', installationController.getInstallationRequestSummary);

/**
 * GET /api/v1/owners/:ownerId/vehicles
 * Get owner's vehicles for selection
 * Access: Owner or Admin
 */
router.get('/owners/:ownerId/vehicles', installationController.getOwnerVehicles);

/**
 * GET /api/v1/vehicles/search
 * Search vehicles globally or by owner
 * Access: All authenticated users
 */
router.get('/vehicles/search', installationController.searchVehicles);

/**
 * POST /api/v1/installation-requests/:id/assign
 * Assign device to installation request
 * Access: Admin only
 */
router.post('/:id/assign', authorize('admin'), installationController.assignInstallationRequest);

/**
 * POST /api/v1/installation-requests/:id/complete
 * Complete installation request
 * Access: Service Provider or Admin
 */
router.post('/:id/complete', authorize('service'), installationController.completeInstallationRequest);

/**
 * GET /api/v1/installation-requests/:id/raw
 * Get raw installation request data (for debug)
 * Access: Owner or Admin
 */
router.get('/:id/raw', installationController.getRawInstallationRequest);

/**
 * POST /api/v1/installation-requests/:id/cancel
 * Cancel installation request
 * Access: Owner or Admin
 */
router.post('/:id/cancel', installationController.cancelInstallationRequest);

export default router;