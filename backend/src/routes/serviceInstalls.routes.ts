import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
  startInstallation, 
  completeInstallation, 
  assignInstallation 
} from '../controllers/install.controller';
import { InstallationRequest } from '../models/InstallationRequest.model';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all service install routes
router.use(authenticate);

/**
 * GET /api/service/installs/assigned
 * Get assigned installation requests for service provider
 * Access: Service provider only
 */
router.get('/installs/assigned', authorize('service'), async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }


    // Add cache control headers to prevent caching issues
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    // Build query for installations assigned to this service provider
    // Ensure userId is properly converted to ObjectId
    let spId;
    try {
      spId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const query: any = {
      serviceProviderId: spId
    };
    
    // Filter by status - default to assigned and in_progress
    if (status) {
      query.status = status;
    } else {
      // Default to assigned and in_progress status for service providers
      query.status = { $in: ['assigned', 'in_progress'] };
    }

    // Get installations with pagination
    const installations = await InstallationRequest.find(query)
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vehicleId', 'vin vehicleNumber make vehicleModel year lastVerifiedMileage currentMileage')
      .populate('ownerId', 'firstName lastName email');

    const total = await InstallationRequest.countDocuments(query);

    // Generate ETag based on data content
    const dataString = JSON.stringify({ installations, total, page, limit });
    const etag = require('crypto').createHash('md5').update(dataString).digest('hex');
    res.set('ETag', `"${etag}"`);

    res.status(200).json({
      success: true,
      message: 'Installation requests retrieved successfully',
      data: {
        installations: installations.map(install => ({
          id: install._id,
          vehicleId: install.vehicleId,
          ownerId: install.ownerId,
          serviceProviderId: install.serviceProviderId,
          status: install.status,
          deviceId: install.deviceId,
          requestedAt: install.requestedAt || install.createdAt,
          assignedAt: install.assignedAt,
          startedAt: install.startedAt,
          completedAt: install.completedAt,
          notes: install.notes,
          priority: install.priority || 'medium',
          initialMileage: install.initialMileage,
          solanaTx: install.solanaTx,
          arweaveTx: install.arweaveTx,
          history: install.history,
          vehicle: (install as any).vehicleId,
          owner: (install as any).ownerId
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve installations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/service/install/start
 * Start installation process
 * Access: Service provider only
 */
router.post('/install/start', authorize('service'), startInstallation);

/**
 * POST /api/service/install/complete
 * Complete installation process
 * Access: Service provider only
 */
router.post('/install/complete', authorize('service'), completeInstallation);

/**
 * POST /api/admin/assign-install
 * Assign installation to service provider
 * Access: Admin only
 */
router.post('/admin/assign-install', authorize('admin'), assignInstallation);

export default router;