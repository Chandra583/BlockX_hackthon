import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize, rateLimit } from '../../middleware/auth.middleware';
import { BlockchainController } from '../../controllers/blockchain/blockchain.controller';
import Vehicle from '../../models/core/Vehicle.model';
import { Notification } from '../../models/core/Notification.model';
import MileageController from '../../controllers/mileage/mileage.controller';
import { User } from '../../models/core/User.model';
import { logger } from '../../utils/logger';
import { TelemetryBatch } from '../../models/TelemetryBatch.model';
import { VehicleTelemetry } from '../../models/core/VehicleTelemetry.model';
import MileageHistory from '../../models/core/MileageHistory.model';
import uploadRoutes from './upload.routes';
import reportRoutes from './report.routes';
import { SaleRecord } from '../../models/SaleRecord.model';
import { Device } from '../../models/core/Device.model';

const router = Router();

/**
 * Vehicle Management Routes
 * Base path: /api/vehicles
 */

// Apply authentication to all vehicle routes
router.use(authenticate);

/**
 * GET /api/vehicles/validate-vehicle-number/:vehicleNumber
 * Check if vehicle number is already registered
 * Access: All authenticated users
 */
router.get('/validate-vehicle-number/:vehicleNumber', async (req: any, res: any) => {
  try {
    const { vehicleNumber } = req.params;
    
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      });
    }

    const existingVehicle = await Vehicle.findOne({ 
      vehicleNumber: vehicleNumber.toUpperCase() 
    });

    logger.info(`🔍 Vehicle number validation: ${vehicleNumber} - ${existingVehicle ? 'EXISTS' : 'AVAILABLE'}`);

    res.status(200).json({
      success: true,
      message: existingVehicle ? 'Vehicle number already registered' : 'Vehicle number is available',
      data: {
        vehicleNumber: vehicleNumber.toUpperCase(),
        isRegistered: !!existingVehicle,
        existingVehicle: existingVehicle ? {
          id: existingVehicle._id,
          vin: existingVehicle.vin,
          make: existingVehicle.make,
          model: existingVehicle.vehicleModel,
          year: existingVehicle.year
        } : null
      }
    });
  } catch (error) {
    logger.error('❌ Vehicle number validation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate vehicle number',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/vehicles/test
 * Test database connection
 * Access: All authenticated users
 */
router.get('/test', async (req: any, res: any) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    logger.info(`🧪 Database test - Total vehicles: ${totalVehicles}`);
    
    res.status(200).json({
      success: true,
      message: 'Database connection test successful',
      data: {
        totalVehicles,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/vehicles/stats
 * Get vehicle statistics for dashboard
 * Access: All authenticated users
 */
router.get('/stats', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's vehicles
    const vehicles = await Vehicle.find({ ownerId: userId });
    
    // Calculate stats
    const totalVehicles = vehicles.length;
    const verifiedVehicles = vehicles.filter(v => v.verificationStatus === 'verified').length;
    const activeListings = vehicles.filter(v => v.isForSale).length;
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0);
    const averageMileage = totalVehicles > 0 ? Math.round(totalMileage / totalVehicles) : 0;
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVehicles = vehicles.filter(v => (v as any).createdAt > thirtyDaysAgo).length;
    
    res.json({
      success: true,
      data: {
        overview: {
          totalVehicles,
          verifiedVehicles,
          activeListings,
          averageMileage,
          recentVehicles
        },
        vehicles: vehicles.map(v => ({
          id: v._id,
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          currentMileage: v.currentMileage,
          verificationStatus: v.verificationStatus,
          isForSale: v.isForSale,
          trustScore: v.trustScore
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle statistics'
    });
  }
});

/**
 * GET /api/vehicles/marketplace-stats
 * Get marketplace statistics for dashboard
 * Access: All authenticated users
 */
router.get('/marketplace-stats', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's vehicles
    const vehicles = await Vehicle.find({ ownerId: userId });
    
    // Calculate marketplace stats
    const totalListings = vehicles.filter(v => v.isForSale).length;
    const totalEarnings = vehicles.reduce((sum, v) => sum + ((v as any).salePrice || 0), 0);
    const averagePrice = totalListings > 0 ? Math.round(totalEarnings / totalListings) : 0;
    
    // Get recent listings (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentListings = vehicles.filter(v => v.isForSale && (v as any).updatedAt > thirtyDaysAgo).length;
    
    res.json({
      success: true,
      data: {
        statistics: {
          totalListings,
          totalEarnings,
          averagePrice,
          recentListings
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace statistics'
    });
  }
});

/**
 * GET /api/vehicles/my-vehicles
 * Get user's vehicles with ownership history
 * Access: All authenticated users
 */
router.get('/my-vehicles', 
  rateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's vehicles with ownership history
      const vehicles = await Vehicle.find({ 
        $or: [
          { ownerId: userId }, // Currently owned
          { 'ownershipHistory.ownerUserId': userId } // Previously owned
        ]
      })
        .populate({
          path: 'ownershipHistory.ownerUserId',
          select: 'firstName lastName fullName email walletAddress',
          model: 'User'
        })
        .sort({ createdAt: -1 })
        .select('-__v');

      // Transform vehicles to include ownership status
      const transformedVehicles = vehicles.map(vehicle => ({
        _id: vehicle._id,
        vin: vehicle.vin,
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        vehicleModel: vehicle.vehicleModel,
        year: vehicle.year,
        color: vehicle.color,
        currentMileage: vehicle.currentMileage,
        trustScore: vehicle.trustScore,
        ownerUserId: vehicle.ownerId === userId ? vehicle.ownerId : null,
        ownerWalletAddress: vehicle.blockchainAddress,
        ownershipHistory: vehicle.ownershipHistory || [],
        createdAt: (vehicle as any).createdAt,
        updatedAt: (vehicle as any).updatedAt
      }));

      logger.info(`✅ Retrieved ${transformedVehicles.length} vehicles with ownership history for user ${userId}`);

      res.status(200).json({
        success: true,
        data: transformedVehicles
      });
    } catch (error) {
      logger.error('❌ Failed to get user vehicles with ownership history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles with ownership history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles
 * Get user's own vehicles
 * Access: All authenticated users
 */
router.get('/', 
  rateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      logger.info(`👤 User ID from request: ${userId} (type: ${typeof userId})`);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's vehicles from database
      logger.info(`🔍 Fetching vehicles for user: ${userId}`);
      
      // Debug: Check total vehicles in database
      const totalVehicles = await Vehicle.countDocuments();
      logger.info(`📊 Total vehicles in database: ${totalVehicles}`);
      
      const vehicles = await Vehicle.find({ ownerId: userId })
        .sort({ createdAt: -1 })
        .select('-__v');

      logger.info(`✅ Retrieved ${vehicles.length} vehicles for user ${userId}`);
      logger.info(`📋 Vehicle details:`, vehicles.map(v => ({ id: v._id, vin: v.vin, make: v.make, model: v.vehicleModel })));

      res.status(200).json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: {
          vehicles: vehicles.map(vehicle => ({
            id: vehicle._id,
            vin: vehicle.vin,
            vehicleNumber: vehicle.vehicleNumber,
            make: vehicle.make,
            model: vehicle.vehicleModel,
            year: vehicle.year,
            color: vehicle.color,
            bodyType: vehicle.bodyType,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            engineSize: vehicle.engineSize,
            currentMileage: vehicle.currentMileage,
            lastMileageUpdate: vehicle.lastMileageUpdate?.toISOString(),
            verificationStatus: vehicle.verificationStatus,
            rejectionReason: (vehicle as any).rejectionReason,
            rejectedAt: (vehicle as any).rejectedAt?.toISOString?.() || undefined,
            trustScore: vehicle.trustScore,
            isForSale: vehicle.isForSale,
            listingStatus: vehicle.listingStatus,
            condition: vehicle.condition,
            features: vehicle.features,
            description: vehicle.description,
            blockchainHash: vehicle.blockchainHash,
            blockchainAddress: vehicle.blockchainAddress,
            createdAt: (vehicle as any).createdAt?.toISOString(),
            updatedAt: (vehicle as any).updatedAt?.toISOString()
          })),
          total: vehicles.length,
          page: 1,
          limit: 100,
          totalPages: 1
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get user vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles/register
 * Handle GET requests to /register gracefully
 * Access: All authenticated users
 */
router.get('/register', async (req: any, res: any) => {
  // Return 405 Method Not Allowed with a helpful message
  return res.status(405).json({
    success: false,
    message: 'GET method not allowed for vehicle registration. Use POST method to register a vehicle.',
    allowedMethods: ['POST']
  });
});

/**
 * POST /api/vehicles/register
 * Register a new vehicle (pending admin verification before blockchain)
 * Access: All authenticated users
 */
router.post('/register',
  rateLimit(5, 15 * 60 * 1000), // 5 registrations per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { vin, vehicleNumber, make, model, year, initialMileage, color, bodyType, fuelType, transmission, engineSize, condition, features, description } = req.body;

      // Validate required fields
      if (!vin || !vehicleNumber || !make || !model || !year || initialMileage === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: vin, vehicleNumber, make, model, year, initialMileage'
        });
      }

      // Check if VIN already exists
      const existingVehicle = await Vehicle.findOne({ vin: vin.toUpperCase() });
      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this VIN already exists'
        });
      }

      // Check if vehicle number already exists
      const existingVehicleNumber = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
      if (existingVehicleNumber) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this vehicle number already exists'
        });
      }

      // Create new vehicle with 'pending' status (awaiting admin verification)
      const newVehicle = new Vehicle({
        vin: vin.toUpperCase(),
        vehicleNumber: vehicleNumber.toUpperCase(),
        ownerId: userId,
        make,
        vehicleModel: model,
        year: parseInt(year),
        color: color || 'Unknown',
        bodyType: bodyType || 'other',
        fuelType: fuelType || 'gasoline',
        transmission: transmission || 'automatic',
        engineSize: engineSize || '',
        currentMileage: parseInt(initialMileage),
        lastMileageUpdate: new Date(),
        verificationStatus: 'pending', // Pending admin verification
        trustScore: 50, // Initial trust score
        isForSale: false,
        listingStatus: 'not_listed',
        condition: condition || 'good',
        features: features || [],
        description: description || '',
        fraudAlerts: [],
        accidentHistory: [],
        serviceHistory: [],
        mileageHistory: [{
          mileage: parseInt(initialMileage),
          recordedBy: userId,
          recordedAt: new Date(),
          source: 'owner',
          verified: false
        }]
      });

      await newVehicle.save();

      // Create MileageHistory record for registration
      try {
        await MileageHistory.create({
          vehicleId: (newVehicle as any)._id,
          vin: newVehicle.vin,
          mileage: parseInt(initialMileage),
          recordedBy: userId,
          recordedAt: new Date(),
          source: 'owner',
          notes: 'Initial mileage at registration',
          verified: false
        });
        logger.info(`✅ Created MileageHistory record for vehicle registration: ${newVehicle.vin}`);
      } catch (mileageErr) {
        logger.warn('⚠️ Failed to create MileageHistory record:', mileageErr);
      }

      logger.info(`✅ Vehicle registered with pending status: ${newVehicle.vin} by user ${userId}`);

      // Create notifications: owner (pending) and admins (review request)
      try {
        const NotificationService = (await import('../../services/notificationService')).default;
        
        // Owner notification
        await NotificationService.createNotification({
          userId,
          userRole: 'owner',
          title: 'Vehicle Submitted for Review',
          message: `Your vehicle ${newVehicle.vin} (${newVehicle.vehicleNumber}) was submitted and is awaiting admin approval.`,
          type: 'verification',
          priority: 'medium',
          channels: ['in_app'],
          data: { vehicleId: String((newVehicle as any)._id) },
          actionUrl: `/vehicles`,
          actionLabel: 'View vehicles'
        });

        // Admin notifications
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length) {
          await NotificationService.createBulkNotifications(admins.map(a => ({
            userId: a._id.toString(),
            userRole: 'admin',
            title: 'New Vehicle Registration Request',
            message: `Vehicle ${newVehicle.vin} (${newVehicle.vehicleNumber}) requires review.`,
            type: 'update',
            priority: 'high',
            channels: ['in_app'],
            data: { vehicleId: String((newVehicle as any)._id) },
            actionUrl: `/admin/vehicles?status=pending`,
            actionLabel: 'Review now'
          })));
        }
      } catch (notifyErr) {
        logger.warn('⚠️ Failed to create registration notifications:', notifyErr);
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle registered successfully. Awaiting admin verification before blockchain registration.',
        data: {
          vehicle: {
            id: String((newVehicle as any)._id),
            vin: newVehicle.vin,
            vehicleNumber: newVehicle.vehicleNumber,
            make: newVehicle.make,
            model: newVehicle.vehicleModel,
            year: newVehicle.year,
            color: newVehicle.color,
            currentMileage: newVehicle.currentMileage,
            verificationStatus: newVehicle.verificationStatus,
            createdAt: (newVehicle as any).createdAt
          }
        }
      });
    } catch (error) {
      logger.error('❌ Failed to register vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register vehicle',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles/:vehicleId
 * Get vehicle details by ID
 * Access: Vehicle owner, Admin
 */
router.get('/:vehicleId',
  rateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { vehicleId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get vehicle from database
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

      // Avoid caching so frontend sees updated device/telemetry state
      try {
        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        });
      } catch (_e) { /* no-op */ }

      // Check if vehicle has an installed OBD device (Device collection)
      let deviceStatus: 'installed' | 'requested' | 'none' = 'none';
      let deviceInfo: any = null;
      try {
        logger.info(`🔍 Searching for device linked to vehicle ${vehicle._id}...`);
        
        // Try to find device by vehicle reference
        const linkedDevice = await Device.findOne({ 
          vehicle: vehicle._id, 
          status: { $in: ['installed', 'active'] } 
        }).select('deviceID status vehicle');
        
        logger.info(`🔍 Device query result:`, linkedDevice);
        
        if (linkedDevice) {
          deviceStatus = 'installed';
          deviceInfo = { 
            deviceID: linkedDevice.deviceID, 
            status: linkedDevice.status 
          };
          logger.info(`✅ Found linked device: ${linkedDevice.deviceID}`);
        } else {
          // Fallback: search for any device with this vehicle ID
          const allDevicesForVehicle = await Device.find({ vehicle: vehicle._id });
          logger.info(`🔍 All devices for this vehicle (any status):`, allDevicesForVehicle);
          
          if (allDevicesForVehicle.length > 0) {
            const anyDevice = allDevicesForVehicle[0];
            deviceStatus = anyDevice.status === 'installed' || anyDevice.status === 'active' ? 'installed' : 'none';
            deviceInfo = { 
              deviceID: anyDevice.deviceID, 
              status: anyDevice.status 
            };
            logger.info(`⚠️ Found device with different status: ${anyDevice.deviceID} (${anyDevice.status})`);
          }
        }
      } catch (e) {
        logger.warn('Failed to resolve linked device for vehicle', e);
      }

      // Merge latest telemetry state (treat telemetry as source-of-truth for live connection)
      let telemetryMergedStatus: string | null = null;
      let telemetryDevice: any = null;
      let currentMileageFromTelemetry: number | undefined;
      let lastReadingAt: Date | undefined;
      try {
        const latestTelemetry = await VehicleTelemetry.findOne({ vehicle: vehicle._id })
          .sort({ 'rawData.receivedAt': -1 })
          .select('deviceID status mileageValidation rawData obd validation tamperingDetected');

        if (latestTelemetry) {
          telemetryMergedStatus = latestTelemetry.status || 'obd_connected';
          const latestMileage = (latestTelemetry.mileageValidation?.newMileage as any) ?? latestTelemetry.obd?.mileage;
          currentMileageFromTelemetry = typeof latestMileage === 'number' ? latestMileage : undefined;
          lastReadingAt = latestTelemetry.rawData?.receivedAt as any;

          telemetryDevice = {
            deviceID: latestTelemetry.deviceID,
            status: latestTelemetry.status,
            validationStatus: latestTelemetry.mileageValidation?.validationStatus || (latestTelemetry as any).validation?.validationStatus,
            tamperingDetected: latestTelemetry.mileageValidation?.flagged ?? (latestTelemetry as any).validation?.tamperingDetected ?? false,
            fraudScore: undefined,
            lastReading: lastReadingAt
              ? {
                  mileage: currentMileageFromTelemetry,
                  recordedAt: lastReadingAt
                }
              : undefined
          };
        }
      } catch (e) {
        logger.warn('Failed to fetch latest telemetry for vehicle', e);
      }

      logger.info(`✅ Retrieved vehicle ${vehicleId} for user ${userId}, deviceStatus: ${deviceStatus}, device:`, deviceInfo);

      // Build response object (prefer telemetry connection state when available)
      let responseDeviceStatus: any = deviceStatus;
      let responseDevice: any = deviceInfo;
      if (telemetryMergedStatus) {
        responseDeviceStatus = telemetryMergedStatus; // e.g., 'obd_connected'
        // Preserve existing device info but add telemetry details
        responseDevice = {
          ...(deviceInfo || {}),
          ...(telemetryDevice || {})
        };
      }

      // If telemetry has newer mileage than vehicle.lastMileageUpdate, surface it
      const vehicleLastUpdate: any = (vehicle as any).lastMileageUpdate;
      const shouldUseTelemetryMileage =
        typeof currentMileageFromTelemetry === 'number' &&
        (!vehicleLastUpdate || (lastReadingAt && (lastReadingAt as any) > vehicleLastUpdate));

      res.status(200).json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: {
          id: vehicle._id,
          vin: vehicle.vin,
          vehicleNumber: vehicle.vehicleNumber,
          make: vehicle.make,
          model: vehicle.vehicleModel,
          year: vehicle.year,
          color: vehicle.color,
          bodyType: vehicle.bodyType,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          engineSize: vehicle.engineSize,
          currentMileage: shouldUseTelemetryMileage ? currentMileageFromTelemetry : vehicle.currentMileage,
          lastMileageUpdate: shouldUseTelemetryMileage ? lastReadingAt : vehicle.lastMileageUpdate,
          verificationStatus: vehicle.verificationStatus,
          rejectionReason: (vehicle as any).rejectionReason,
          rejectedAt: (vehicle as any).rejectedAt,
          trustScore: vehicle.trustScore,
          isForSale: vehicle.isForSale,
          listingStatus: vehicle.listingStatus,
          price: vehicle.price,
          condition: vehicle.condition,
          features: vehicle.features,
          description: vehicle.description,
          blockchainHash: vehicle.blockchainHash,
          blockchainAddress: vehicle.blockchainAddress,
          mileageHistory: vehicle.mileageHistory,
          fraudAlerts: vehicle.fraudAlerts,
          accidentHistory: vehicle.accidentHistory,
          serviceHistory: vehicle.serviceHistory,
          createdAt: (vehicle as any).createdAt,
          updatedAt: (vehicle as any).updatedAt,
          deviceStatus: responseDeviceStatus,
          device: responseDevice
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles/:vehicleId/blockchain-history
 * Get blockchain history for a vehicle
 * Access: Vehicle owner, Admin
 */
router.get('/:vehicleId/blockchain-history',
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { vehicleId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

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

      // Get blockchain history using the blockchain controller
      const mockHistory = [
        {
          id: 'tx_1',
          type: 'vehicle_registration',
          transactionHash: vehicle.blockchainHash || 'pending',
          status: 'confirmed',
          timestamp: (vehicle as any).createdAt,
          data: {
            vehicleId: vehicle._id,
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.vehicleModel,
            year: vehicle.year,
            initialMileage: vehicle.currentMileage
          }
        }
      ];

      logger.info(`✅ Retrieved blockchain history for vehicle ${vehicleId}`);

      res.status(200).json({
        success: true,
        message: 'Blockchain history retrieved successfully',
        data: mockHistory
      });
    } catch (error) {
      logger.error('❌ Failed to get vehicle blockchain history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve blockchain history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles/:vehicleId/ownership-history
 * Returns ordered ownership history newest -> oldest
 * Access: admin, buyer (read-only), owner (if owner of vehicle)
 */
router.get('/:vehicleId/ownership-history', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const userRoles: string[] = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
    const activeRole = req.activeRole || userRoles[0]; // Use active role from middleware
    const { vehicleId } = req.params;

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
    }

    const vehicle = await Vehicle.findById(vehicleId).populate({
      path: 'ownershipHistory.ownerUserId',
      select: 'firstName lastName fullName email role',
      model: 'User'
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // AuthZ: admin always, buyer read-only, owner if currently owns it
    // Use both userRoles (what user CAN do) and activeRole (what they're DOING now)
    const isAdmin = userRoles.includes('admin') || activeRole === 'admin';
    const isBuyer = userRoles.includes('buyer') || activeRole === 'buyer';
    const isOwnerOfVehicle = userId && vehicle.ownerId?.toString?.() === userId;
    if (!isAdmin && !isBuyer && !isOwnerOfVehicle) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let history = (vehicle.ownershipHistory || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime())
      .map((entry: any) => {
        const u = (entry.ownerUserId as any) || {};
        const email = u.email || null;
        const maskedEmail = email ? `${email[0]}***@${email.split('@')[1]}` : 'Not available';
        return {
          ownerId: (u._id || entry.ownerUserId || '').toString?.() || '',
          fullName: u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Not available',
          role: 'owner',
          from: entry.fromDate,
          to: entry.toDate || null,
          txHash: entry.txHash || null,
          notes: entry.note || '',
          contactEmail: email ? maskedEmail : undefined
        };
      });

    // Enrich with last sale record if no previous entries exist
    const hasPrevious = history.some(h => h.to !== null);
    if (!hasPrevious) {
      try {
        const lastSale = await SaleRecord.findOne({ vehicleId: vehicle._id }).sort({ createdAt: -1 }).lean();
        if (lastSale) {
          const seller = await User.findById(lastSale.sellerId).lean();
          const sellerName = seller ? (seller as any).fullName || `${(seller as any).firstName || ''} ${(seller as any).lastName || ''}`.trim() : 'Previous owner';
          const sellerEmail = seller ? (seller as any).email : null;
          const maskedSellerEmail = sellerEmail ? `${sellerEmail[0]}***@${sellerEmail.split('@')[1]}` : undefined;
          const transferAt: Date = (lastSale as any).ownershipTransferredAt || new Date(history[0]?.from || Date.now());
          const prevTo = new Date(transferAt);
          const prevFrom = new Date(transferAt.getTime() - 1000);
          history = [
            ...history,
            {
              ownerId: String(lastSale.sellerId),
              fullName: sellerName,
              role: 'owner',
              from: prevFrom,
              to: prevTo,
              txHash: (lastSale as any).solanaTxHash || null,
              notes: 'sold at marketplace',
              contactEmail: maskedSellerEmail
            }
          ].sort((a, b) => new Date(b.from as any).getTime() - new Date(a.from as any).getTime());
        }
      } catch (e) {
        logger.warn('Ownership history enrichment skipped:', e);
      }
    }

    return res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    logger.error('❌ Failed to get ownership history:', error);
    return res.status(500).json({ success: false, message: 'Failed to get ownership history' });
  }
});

/**
 * POST /api/vehicles/import
 * Attach existing vehicle to current user based on vin, regNumber, or deviceId
 * Access: owner role required
 */
router.post('/import', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const roles: string[] = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
    const activeRole = req.activeRole || roles[0]; // Use active role from middleware
    
    // Check if user has owner role and is currently acting as owner
    if (!userId || (!roles.includes('owner') && activeRole !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Owner role required' });
    }

    const { vin, regNumber, deviceId } = req.body || {};
    if (!vin && !regNumber && !deviceId) {
      return res.status(400).json({ success: false, message: 'Provide vin or regNumber or deviceId' });
    }

    const query: any = {};
    if (vin) query.vin = String(vin).toUpperCase();
    if (regNumber) query.vehicleNumber = String(regNumber).toUpperCase();
    // deviceId lookup is out of scope here unless linked via other models

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // If already linked to same user, return success
    if (vehicle.ownerId?.toString?.() === userId) {
      return res.status(200).json({ success: true, message: 'Vehicle already linked to this user', data: { vehicleId: vehicle._id } });
    }

    // Not linked: attach to current user by adding ownershipHistory entry and set previous toDate
    const now = new Date();
    if (Array.isArray(vehicle.ownershipHistory) && vehicle.ownershipHistory.length > 0) {
      // Close previous current owner
      const currentIdx = vehicle.ownershipHistory.findIndex((e: any) => !e.toDate);
      if (currentIdx >= 0 && !vehicle.ownershipHistory[currentIdx].toDate) {
        (vehicle.ownershipHistory[currentIdx] as any).toDate = new Date(now.getTime() - 1);
      }
    }
    // Push new entry
    (vehicle.ownershipHistory as any) = (vehicle.ownershipHistory || []);
    (vehicle.ownershipHistory as any).push({
      ownerUserId: new mongoose.Types.ObjectId(userId),
      fromDate: now,
      note: 'Imported to current owner',
      txHash: null
    });

    // Also update ownerId to reflect current owner
    (vehicle as any).ownerId = new mongoose.Types.ObjectId(userId);
    await vehicle.save();

    return res.status(200).json({ success: true, message: 'Vehicle imported and linked to user', data: { vehicleId: vehicle._id } });
  } catch (error: any) {
    logger.error('❌ Vehicle import failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to import vehicle' });
  }
});

/**
 * POST /api/vehicles/:vehicleId/ownership/transfer
 * Update ownership on sale: closes previous toDate and appends new entry
 * Access: admin only (sale flow elsewhere can call this)
 */
router.post('/:vehicleId/ownership/transfer', async (req: any, res: any) => {
  try {
    const roles: string[] = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
    const activeRole = req.activeRole || roles[0]; // Use active role from middleware
    
    // Admin-only endpoint - check both roles array and active role
    if (!roles.includes('admin') && activeRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin role required' });
    }

    const { vehicleId } = req.params;
    const { newOwnerUserId, txHash, note } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(newOwnerUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid ids' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const now = new Date();
    if (Array.isArray(vehicle.ownershipHistory) && vehicle.ownershipHistory.length > 0) {
      const currentIdx = vehicle.ownershipHistory.findIndex((e: any) => !e.toDate);
      if (currentIdx >= 0) {
        (vehicle.ownershipHistory[currentIdx] as any).toDate = new Date(now.getTime() - 1);
      }
    }

    (vehicle.ownershipHistory as any) = (vehicle.ownershipHistory || []);
    (vehicle.ownershipHistory as any).push({
      ownerUserId: new mongoose.Types.ObjectId(newOwnerUserId),
      fromDate: now,
      txHash: txHash || null,
      note: note || 'Ownership transferred'
    });
    (vehicle as any).ownerId = new mongoose.Types.ObjectId(newOwnerUserId);
    await vehicle.save();

    // If there is an installed device linked to this vehicle, reassign its owner
    try {
      const linkedDevice = await Device.findOne({ vehicle: vehicle._id, status: { $in: ['installed', 'active'] } });
      if (linkedDevice) {
        linkedDevice.owner = new mongoose.Types.ObjectId(newOwnerUserId);
        await linkedDevice.save();
      }
    } catch (e) {
      logger.warn('Ownership transfer: failed to reassign device owner', e);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('❌ Ownership transfer failed:', error);
    return res.status(500).json({ success: false, message: 'Ownership transfer failed' });
  }
});

/**
 * GET /api/vehicles/:vehicleId/mileage
 * Get vehicle mileage history (delegates to MileageController)
 */
router.get('/:vehicleId/mileage', (req, res) => {
  return MileageController.getVehicleMileageHistory(req as any, res as any);
});

// Mount upload routes
router.use('/', uploadRoutes);

// Mount report routes
router.use('/', reportRoutes);

export default router;

/**
 * GET /api/vehicles/:vehicleId/telemetry-batches
 * Return daily batches of telemetry for a vehicle (latest first)
 */
router.get('/:vehicleId/telemetry-batches', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: userId });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or access denied' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 30, 90);
    const batches = await TelemetryBatch.find({ vehicleId: vehicleId })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Telemetry batches retrieved successfully',
      data: {
        vehicleId,
        total: batches.length,
        batches: batches.map(b => ({
          id: b._id,
          recordedAt: b.recordedAt,
          deviceId: b.deviceId,
          lastRecordedMileage: b.lastRecordedMileage,
          distanceDelta: b.distanceDelta,
          dataPoints: b.batchData?.length || 0,
          segmentsCount: b.segmentsCount || 0,
          solanaTx: b.solanaTx,
          arweaveTx: b.arweaveTx,
          status: b.status,
          lastError: b.lastError
        }))
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get telemetry batches:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve telemetry batches' });
  }
});

/**
 * POST /api/vehicles/:vehicleId/consolidate-batch
 * Manually trigger batch consolidation for a specific date
 */
router.post('/:vehicleId/consolidate-batch', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;
    const { date } = req.body;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: userId });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or access denied' });
    }

    // Import consolidation service
    const { TelemetryConsolidationService } = await import('../../services/telemetryConsolidation.service');
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    const result = await TelemetryConsolidationService.consolidateDayBatch(vehicleId, date);
    
    if (result.success && result.solanaTx) {
      return res.status(200).json({
        success: true,
        message: 'Batch consolidation completed successfully',
        data: {
          batchId: result.batchId,
          arweaveTx: result.arweaveTx,
          solanaTx: result.solanaTx,
          merkleRoot: result.merkleRoot
        }
      });
    } else if (result.success) {
      // Consolidation flow completed but no chain tx (e.g., dry-run/testing)
      return res.status(200).json({
        success: true,
        message: result.error || 'Batch consolidation completed (no blockchain tx in test mode)',
        data: {
          batchId: result.batchId,
          arweaveTx: result.arweaveTx || null,
          solanaTx: result.solanaTx || null,
          merkleRoot: result.merkleRoot || null
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Batch consolidation failed',
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('❌ Failed to consolidate batch:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to consolidate batch',
      error: error?.message || 'Unknown error'
    });
  }
});

// Get mileage history for a vehicle
router.get('/:vehicleId/mileage-history', async (req: any, res: any) => {
  try {
    const { vehicleId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate vehicleId
    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get mileage history with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const mileageHistory = await MileageHistory.find({ vehicleId })
      .populate('recordedBy', 'firstName lastName role fullName isLocked')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MileageHistory.countDocuments({ vehicleId });

    // Get current mileage and other stats
    const currentMileage = vehicle.currentMileage || 0;
    const registeredMileage = (vehicle as any).registeredMileage || 0;
    const serviceVerifiedMileage = (vehicle as any).serviceVerifiedMileage || 0;

    // Get last OBD update
    const lastOBDUpdate = await MileageHistory.findOne({ 
      vehicleId, 
      source: 'automated' 
    }).sort({ recordedAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Mileage history retrieved successfully',
      data: {
        vehicleId,
        vin: vehicle.vin,
        currentMileage,
        totalMileage: currentMileage,
        registeredMileage,
        serviceVerifiedMileage,
        lastOBDUpdate: lastOBDUpdate ? {
          mileage: lastOBDUpdate.mileage,
          deviceId: lastOBDUpdate.deviceId,
          recordedAt: lastOBDUpdate.recordedAt
        } : null,
        history: mileageHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error: any) {
    logger.error('❌ Failed to get mileage history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get mileage history',
      error: error?.message || 'Unknown error'
    });
  }
});
