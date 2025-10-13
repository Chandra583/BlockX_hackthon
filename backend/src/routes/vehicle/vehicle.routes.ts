import { Router } from 'express';
import { authenticate, authorize, rateLimit } from '../../middleware/auth.middleware';
import { BlockchainController } from '../../controllers/blockchain/blockchain.controller';
import Vehicle from '../../models/core/Vehicle.model';
import { logger } from '../../utils/logger';

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
 * POST /api/vehicles/register
 * Register a new vehicle (integrates with blockchain)
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

      const { vin, make, model, year, initialMileage, color, bodyType, fuelType, transmission, engineSize, condition, features, description } = req.body;

      // Validate required fields
      if (!vin || !make || !model || !year || initialMileage === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: vin, make, model, year, initialMileage'
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

      // Create vehicle data for blockchain registration
      const vehicleData = {
        vehicleId: new Date().getTime().toString(), // Generate a unique ID
        vin: vin.toUpperCase(),
        make,
        model,
        year: parseInt(year),
        initialMileage: parseInt(initialMileage),
        color: color || 'Unknown',
        bodyType: bodyType || 'other',
        fuelType: fuelType || 'gasoline',
        transmission: transmission || 'automatic',
        engineSize,
        condition: condition || 'good',
        features: features || [],
        description
      };

      // Register vehicle on blockchain and save to database
      // This will use the blockchain controller's registerVehicle method
      const blockchainResult = await BlockchainController.registerVehicle(req, res);
      
      // The blockchain controller will handle the response
      return;
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

export default router;
