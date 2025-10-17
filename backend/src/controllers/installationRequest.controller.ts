import { Request, Response } from 'express';
import { InstallationRequest } from '../models/InstallationRequest.model';
import Vehicle from '../models/core/Vehicle.model';
import { Device } from '../models/core/Device.model';
import { logger } from '../utils/logger';

// Create a new installation request
export const createInstallationRequest = async (req: Request, res: Response) => {
  try {
    const { ownerId, vehicleId, notes } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Validate that the owner owns the vehicle (unless admin)
    if (userRole !== 'admin') {
      const vehicle = await Vehicle.findOne({ 
        _id: vehicleId, 
        ownerId: ownerId || userId 
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or access denied'
        });
      }
    }

    // Check if there's already an active installation request for this vehicle
    const existingRequest = await InstallationRequest.findOne({ 
      vehicleId, 
      status: { $in: ['requested', 'assigned'] } 
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'Installation request already exists for this vehicle'
      });
    }

    // Create new installation request
    const installRequest = new InstallationRequest({
      ownerId: ownerId || userId,
      vehicleId,
      requestedBy: userId,
      status: 'requested',
      notes,
      history: [{
        action: 'created',
        by: userId,
        at: new Date()
      }]
    });

    await installRequest.save();

    logger.info(`✅ Installation request created for vehicle ${vehicleId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Installation request created successfully',
      data: {
        id: installRequest._id,
        status: installRequest.status,
        createdAt: installRequest.createdAt
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
};

// Get installation requests with filters
export const getInstallationRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { ownerId, status, q, page = 1, limit = 20 } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Build query based on user role
    const query: any = {};
    
    // Apply ownership filter
    if (ownerId) {
      query.ownerId = ownerId;
    } else if (userRole !== 'admin') {
      // Regular users can only see their own requests
      query.ownerId = userId;
    }
    
    // Apply status filter
    if (status) {
      query.status = status;
    }
    
    // Apply search filter
    if (q) {
      // For search, we'll need to do a more complex query with populate
      // This is a simplified version - in production you might want to use text search
    }

    // Get installations with pagination
    const requests = await InstallationRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vehicleId', 'vin vehicleNumber make vehicleModel year')
      .populate('ownerId', 'firstName lastName email')
      .populate('serviceProviderId', 'firstName lastName email')
      .populate('deviceId', 'deviceID status');

    const total = await InstallationRequest.countDocuments(query);

    logger.info(`✅ Retrieved ${requests.length} installation requests for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Installation requests retrieved successfully',
      data: {
        requests: requests.map(request => ({
          id: request._id,
          vehicleId: request.vehicleId,
          ownerId: request.ownerId,
          serviceProviderId: request.serviceProviderId,
          deviceId: request.deviceId,
          status: request.status,
          notes: request.notes,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          installedAt: request.installedAt,
          vehicle: (request as any).vehicleId,
          owner: (request as any).ownerId,
          serviceProvider: (request as any).serviceProviderId,
          device: (request as any).deviceId
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get installation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve installation requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get installation request summary for owner's vehicles
export const getInstallationRequestSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { ownerId } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Determine which owner's requests to fetch
    const targetOwnerId = ownerId && userRole === 'admin' ? ownerId : userId;

    // Get active installation requests for the owner
    const requests = await InstallationRequest.find({ 
      ownerId: targetOwnerId,
      status: { $in: ['requested', 'assigned', 'completed'] }
    }).select('ownerId vehicleId status deviceId installedAt serviceProviderId createdAt history');

    // Create a map of vehicleId to request status
    const summary: Record<string, any> = {};
    requests.forEach(request => {
      // Find the assignedAt timestamp from history
      const assignedHistory = request.history.find((h: any) => h.action === 'assigned');
      
      summary[request.vehicleId.toString()] = {
        id: request._id,
        vehicleId: request.vehicleId,
        ownerId: request.ownerId,
        status: request.status,
        deviceId: request.deviceId,
        serviceProviderId: request.serviceProviderId,
        createdAt: request.createdAt,
        assignedAt: assignedHistory ? assignedHistory.at : null,
        installedAt: request.installedAt
      };
    });

    logger.info(`✅ Retrieved installation request summary for owner ${targetOwnerId}`);

    res.status(200).json({
      success: true,
      message: 'Installation request summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    logger.error('❌ Failed to get installation request summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve installation request summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get owner's vehicles for selection
export const getOwnerVehicles = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const { q, page = 1, limit = 20 } = req.query as any;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Check if user can access this owner's vehicles
    if (userId !== ownerId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query: any = { ownerId };
    
    // Apply search filter
    if (q) {
      query.$or = [
        { vehicleNumber: { $regex: q, $options: 'i' } },
        { vin: { $regex: q, $options: 'i' } }
      ];
    }

    // Get vehicles with pagination
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('vin vehicleNumber make vehicleModel year');

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles: vehicles.map(vehicle => ({
          id: vehicle._id,
          registration: vehicle.vehicleNumber,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.vehicleModel,
          year: vehicle.year
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get owner vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search vehicles globally or by owner
export const searchVehicles = async (req: Request, res: Response) => {
  try {
    const { q, ownerId } = req.query as any;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Build query
    const query: any = {};
    
    // Apply ownership filter
    if (ownerId) {
      // Check if user can access this owner's vehicles
      if (userId !== ownerId && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      query.ownerId = ownerId;
    }

    // Apply search filter
    if (q) {
      query.$or = [
        { vehicleNumber: { $regex: q, $options: 'i' } },
        { vin: { $regex: q, $options: 'i' } }
      ];
    }

    // Get vehicles (limit to 50 for search)
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('vin vehicleNumber make vehicleModel year ownerId');

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles: vehicles.map(vehicle => ({
          id: vehicle._id,
          registration: vehicle.vehicleNumber,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.vehicleModel,
          year: vehicle.year,
          ownerId: vehicle.ownerId
        }))
      }
    });
  } catch (error) {
    logger.error('❌ Failed to search vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search vehicles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Assign device to installation request
export const assignInstallationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { serviceProviderId } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Only admins can assign installations
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can assign installations.'
      });
    }

    // Verify installation request exists
    const installRequest = await InstallationRequest.findById(id);
    if (!installRequest) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Update installation request
    installRequest.serviceProviderId = serviceProviderId;
    installRequest.status = 'assigned';
    installRequest.history.push({
      action: 'assigned',
      by: userId,
      at: new Date(),
      meta: { serviceProviderId }
    });

    await installRequest.save();

    logger.info(`✅ Installation ${id} assigned to service provider ${serviceProviderId}`);

    res.status(200).json({
      success: true,
      message: 'Installation assigned successfully',
      data: {
        id: installRequest._id,
        status: installRequest.status,
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
};

// Complete installation request
export const completeInstallationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completedBy, installationPhotoUrl, notes } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Only service providers or admins can complete installations
    if (userRole !== 'service' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only service providers or admins can complete installations.'
      });
    }

    // Verify installation request exists
    const installRequest = await InstallationRequest.findById(id);
    if (!installRequest) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Verify this service provider is assigned to this installation (unless admin)
    if (userRole === 'service' && 
        installRequest.serviceProviderId?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Installation not assigned to this service provider.'
      });
    }

    // Update installation request
    installRequest.status = 'completed';
    installRequest.installedAt = new Date();
    if (notes) {
      installRequest.notes = notes;
    }
    installRequest.history.push({
      action: 'completed',
      by: userId,
      at: new Date(),
      meta: { installationPhotoUrl }
    });

    await installRequest.save();

    // Update device status
    if (installRequest.deviceId) {
      const device = await Device.findById(installRequest.deviceId);
      if (device) {
        device.status = 'installed';
        device.vehicle = installRequest.vehicleId;
        device.owner = installRequest.ownerId;
        await device.save();
      }
    }

    // Update vehicle with device information
    await Vehicle.findByIdAndUpdate(installRequest.vehicleId, {
      $set: {
        'device.deviceId': installRequest.deviceId,
        'device.assignedAt': new Date()
      }
    });

    logger.info(`✅ Installation ${id} completed`);

    res.status(200).json({
      success: true,
      message: 'Installation completed successfully',
      data: {
        id: installRequest._id,
        status: installRequest.status,
        installedAt: installRequest.installedAt
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
};

// Get raw installation request data (for debug)
export const getRawInstallationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Verify installation request exists
    const installRequest = await InstallationRequest.findById(id)
      .populate('vehicleId')
      .populate('ownerId')
      .populate('serviceProviderId')
      .populate('deviceId')
      .populate('requestedBy');

    if (!installRequest) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Check access permissions (owner or admin)
    if (userRole !== 'admin' && installRequest.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Installation request retrieved successfully',
      data: installRequest
    });
  } catch (error) {
    logger.error('❌ Failed to get raw installation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve installation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};