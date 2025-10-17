import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Install } from '../models/Install.model';
import Vehicle from '../models/core/Vehicle.model';
import { logger } from '../utils/logger';
import { UserRole } from '../types/user.types';

const router = Router();

// Apply authentication to all install routes
router.use(authenticate);

/**
 * POST /api/installs/vehicles/:vehicleId/request-install
 * Request device installation for a vehicle
 * Access: Vehicle owner
 */
router.post('/vehicles/:vehicleId/request-install', async (req: any, res: any) => {
  try {
    const { vehicleId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Verify vehicle exists and belongs to user
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId, 
      ownerId: userId 
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    // Check if there's already an active installation request for this vehicle
    const existingRequest = await Install.findOne({ 
      vehicleId, 
      status: { $in: ['requested', 'assigned', 'in_progress'] } 
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'Installation request already exists for this vehicle'
      });
    }

    // Create new installation request
    const installRequest = new Install({
      vehicleId,
      ownerId: userId,
      status: 'requested',
      notes,
      priority: 'medium',
      requestedAt: new Date()
    });

    await installRequest.save();

    logger.info(`✅ Installation request created for vehicle ${vehicleId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Installation request created successfully',
      data: {
        installId: installRequest._id,
        status: installRequest.status,
        requestedAt: installRequest.requestedAt
      }
    });
  } catch (error) {
    logger.error('❌ Failed to create installation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create installation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/installs/admin/assign-install
 * Assign installation to service provider (admin only)
 * Access: Admin only
 */
router.post('/admin/assign-install', authorize('admin'), async (req: any, res: any) => {
  try {
    const { installId, serviceProviderId, notes } = req.body;

    // Verify installation request exists
    const installRequest = await Install.findById(installId);
    if (!installRequest) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Update installation request
    installRequest.serviceProviderId = serviceProviderId;
    installRequest.status = 'assigned';
    installRequest.assignedAt = new Date();
    installRequest.notes = notes || installRequest.notes;

    await installRequest.save();

    logger.info(`✅ Installation ${installId} assigned to service provider ${serviceProviderId}`);

    res.status(200).json({
      success: true,
      message: 'Installation assigned successfully',
      data: {
        installId: installRequest._id,
        status: installRequest.status,
        assignedAt: installRequest.assignedAt,
        serviceProviderId: installRequest.serviceProviderId
      }
    });
  } catch (error) {
    logger.error('❌ Failed to assign installation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign installation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/installs/service/install/complete
 * Complete installation (service provider only)
 * Access: Service provider only
 */
router.post('/service/install/complete', authorize('service'), async (req: any, res: any) => {
  try {
    const { installId, deviceId, notes } = req.body;
    const serviceProviderId = req.user?.id;

    // Verify installation request exists
    const installRequest = await Install.findById(installId);
    if (!installRequest) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Verify this service provider is assigned to this installation
    if (installRequest.serviceProviderId?.toString() !== serviceProviderId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Installation not assigned to this service provider.'
      });
    }

    // Update installation request
    installRequest.deviceId = deviceId;
    installRequest.status = 'completed';
    installRequest.completedAt = new Date();
    installRequest.notes = notes || installRequest.notes;

    await installRequest.save();

    // Update vehicle with device information
    await Vehicle.findByIdAndUpdate(installRequest.vehicleId, {
      $set: {
        'device.deviceId': deviceId,
        'device.assignedAt': new Date()
      }
    });

    logger.info(`✅ Installation ${installId} completed with device ${deviceId}`);

    res.status(200).json({
      success: true,
      message: 'Installation completed successfully',
      data: {
        installId: installRequest._id,
        status: installRequest.status,
        completedAt: installRequest.completedAt,
        deviceId: installRequest.deviceId
      }
    });
  } catch (error) {
    logger.error('❌ Failed to complete installation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete installation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/installs/devices
 * Get installation requests with filters
 * Access: All authenticated users (with role-based filtering)
 */
router.get('/devices', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Build query based on user role
    const query: any = {};
    
    if (userRole === 'admin') {
      // Admins can see all installations
      if (status) query.status = status;
    } else if (userRole === 'service') {
      // Service providers can see installations assigned to them
      query.serviceProviderId = userId;
      if (status) query.status = status;
    } else {
      // Regular users can only see their own installations
      query.ownerId = userId;
      if (status) query.status = status;
    }

    // Get installations with pagination
    const installations = await Install.find(query)
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vehicleId', 'vin vehicleNumber make vehicleModel year')
      .populate('ownerId', 'firstName lastName email')
      .populate('serviceProviderId', 'firstName lastName email');

    const total = await Install.countDocuments(query);

    logger.info(`✅ Retrieved ${installations.length} installations for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Installations retrieved successfully',
      data: {
        installations: installations.map(install => ({
          id: install._id,
          vehicleId: install.vehicleId,
          ownerId: install.ownerId,
          serviceProviderId: install.serviceProviderId,
          status: install.status,
          deviceId: install.deviceId,
          requestedAt: install.requestedAt,
          assignedAt: install.assignedAt,
          completedAt: install.completedAt,
          notes: install.notes,
          priority: install.priority,
          vehicle: (install as any).vehicleId,
          owner: (install as any).ownerId,
          serviceProvider: (install as any).serviceProviderId
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get installations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve installations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;