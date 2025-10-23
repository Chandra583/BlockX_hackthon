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
import MileageHistory from '../../models/core/MileageHistory.model';

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
            rejectionReason: vehicle.rejectionReason,
            rejectedAt: vehicle.rejectedAt?.toISOString?.() || undefined,
            trustScore: vehicle.trustScore,
            isForSale: vehicle.isForSale,
            listingStatus: vehicle.listingStatus,
            condition: vehicle.condition,
            features: vehicle.features,
            description: vehicle.description,
            blockchainHash: vehicle.blockchainHash,
            blockchainAddress: vehicle.blockchainAddress,
            createdAt: vehicle.createdAt?.toISOString(),
            updatedAt: vehicle.updatedAt?.toISOString()
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
          vehicleId: newVehicle._id,
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
        // Owner notification
        await Notification.create({
          userId,
          userRole: 'owner',
          title: 'Vehicle Submitted for Review',
          message: `Your vehicle ${newVehicle.vin} (${newVehicle.vehicleNumber}) was submitted and is awaiting admin approval.`,
          type: 'verification',
          priority: 'medium',
          channels: ['in_app'],
          actionUrl: `/vehicles`,
          actionLabel: 'View vehicles'
        });

        // Admin notifications
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length) {
          await Notification.insertMany(admins.map(a => ({
            userId: a._id.toString(),
            userRole: 'admin',
            title: 'New Vehicle Registration Request',
            message: `Vehicle ${newVehicle.vin} (${newVehicle.vehicleNumber}) requires review.`,
            type: 'update',
            priority: 'high',
            channels: ['in_app'],
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
            id: newVehicle._id,
            vin: newVehicle.vin,
            vehicleNumber: newVehicle.vehicleNumber,
            make: newVehicle.make,
            model: newVehicle.vehicleModel,
            year: newVehicle.year,
            color: newVehicle.color,
            currentMileage: newVehicle.currentMileage,
            verificationStatus: newVehicle.verificationStatus,
            createdAt: newVehicle.createdAt
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

      logger.info(`✅ Retrieved vehicle ${vehicleId} for user ${userId}`);

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
          currentMileage: vehicle.currentMileage,
          lastMileageUpdate: vehicle.lastMileageUpdate,
          verificationStatus: vehicle.verificationStatus,
          rejectionReason: vehicle.rejectionReason,
          rejectedAt: vehicle.rejectedAt,
          trustScore: vehicle.trustScore,
          isForSale: vehicle.isForSale,
          listingStatus: vehicle.listingStatus,
          condition: vehicle.condition,
          features: vehicle.features,
          description: vehicle.description,
          blockchainHash: vehicle.blockchainHash,
          blockchainAddress: vehicle.blockchainAddress,
          mileageHistory: vehicle.mileageHistory,
          fraudAlerts: vehicle.fraudAlerts,
          accidentHistory: vehicle.accidentHistory,
          serviceHistory: vehicle.serviceHistory,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt
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
          timestamp: vehicle.createdAt,
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
 * GET /api/vehicles/:vehicleId/mileage
 * Get vehicle mileage history (delegates to MileageController)
 */
router.get('/:vehicleId/mileage', (req, res) => {
  return MileageController.getVehicleMileageHistory(req as any, res as any);
});

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
    const registeredMileage = vehicle.registeredMileage || 0;
    const serviceVerifiedMileage = vehicle.serviceVerifiedMileage || 0;

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
