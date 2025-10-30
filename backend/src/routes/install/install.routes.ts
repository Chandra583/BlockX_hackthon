import { Router } from 'express';
import { authenticate, authorize, rateLimit } from '../../middleware/auth.middleware';
import { InstallController } from '../../controllers/install/install.controller';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Install Management Routes
 * Base path: /api/installs
 */

// Apply authentication to all install routes
router.use(authenticate);

/**
 * GET /api/installs
 * Get install requests for the current user
 * Access: All authenticated users
 */
router.get('/', 
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await InstallController.getInstallsByUser(userId, {
        status,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      logger.info(`✅ Retrieved installs for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Installs retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to get installs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve installs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/installs
 * Create a new install request
 * Access: Vehicle owners
 */
router.post('/',
  rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { vehicleId, location, notes, estimatedDuration } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await InstallController.createInstallRequest(userId, {
        vehicleId,
        location,
        notes,
        estimatedDuration
      });

      logger.info(`✅ Created install request for vehicle ${vehicleId} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Install request created successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to create install request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create install request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/installs/:installId
 * Get install request details
 * Access: Install owner, assigned service provider, admin
 */
router.get('/:installId',
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { installId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await InstallController.getInstallDetails(installId, userId);

      logger.info(`✅ Retrieved install details ${installId} for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Install details retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to get install details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve install details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/installs/:installId/assign
 * Assign install request to service provider (Admin only)
 * Access: Admin
 */
router.put('/:installId/assign',
  authorize('admin'),
  rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const { installId } = req.params;
      const { serviceProviderId, notes } = req.body;

      const result = await InstallController.assignToServiceProvider(installId, {
        serviceProviderId,
        notes,
        assignedBy: req.user.id
      });

      logger.info(`✅ Assigned install ${installId} to service provider ${serviceProviderId}`);

      res.status(200).json({
        success: true,
        message: 'Install request assigned successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to assign install:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign install request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/installs/:installId/start
 * Start installation (Service Provider only)
 * Access: Assigned service provider
 */
router.put('/:installId/start',
  authorize('service'),
  rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const { installId } = req.params;
      const { deviceId, notes } = req.body;

      const result = await InstallController.startInstallation(installId, {
        deviceId,
        notes,
        startedBy: req.user.id
      });

      logger.info(`✅ Started installation ${installId} with device ${deviceId}`);

      res.status(200).json({
        success: true,
        message: 'Installation started successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to start installation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start installation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/installs/:installId/complete
 * Complete installation (Service Provider only)
 * Access: Assigned service provider
 */
router.put('/:installId/complete',
  authorize('service'),
  rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const { installId } = req.params;
      const { notes, feedback } = req.body;

      const result = await InstallController.completeInstallation(installId, {
        notes,
        feedback,
        completedBy: req.user.id
      });

      logger.info(`✅ Completed installation ${installId}`);

      res.status(200).json({
        success: true,
        message: 'Installation completed successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to complete installation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete installation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/installs/:installId/cancel
 * Cancel installation
 * Access: Install owner, assigned service provider, admin
 */
router.put('/:installId/cancel',
  rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const { installId } = req.params;
      const { reason } = req.body;

      const result = await InstallController.cancelInstallation(installId, {
        reason,
        cancelledBy: req.user.id
      });

      logger.info(`✅ Cancelled installation ${installId}`);

      res.status(200).json({
        success: true,
        message: 'Installation cancelled successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to cancel installation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel installation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/installs/admin/pending
 * Get all pending install requests (Admin only)
 * Access: Admin
 */
router.get('/admin/pending',
  authorize('admin'),
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await InstallController.getPendingInstalls({
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      logger.info(`✅ Retrieved pending installs for admin`);

      res.status(200).json({
        success: true,
        message: 'Pending installs retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to get pending installs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending installs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/installs/service-provider/assigned
 * Get assigned install requests (Service Provider only)
 * Access: Service Provider
 */
router.get('/service-provider/assigned',
  authorize('service'),
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await InstallController.getInstallsByServiceProvider(userId, {
        status,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      logger.info(`✅ Retrieved assigned installs for service provider ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Assigned installs retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('❌ Failed to get assigned installs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assigned installs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;



