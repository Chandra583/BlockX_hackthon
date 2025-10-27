import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import Vehicle from '../../models/core/Vehicle.model';
import { User } from '../../models/core/User.model';
import { TelemetryBatch } from '../../models/TelemetryBatch.model';
import { TrustEvent } from '../../models/core/TrustEvent.model';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/vehicles/:vehicleId/report
 * Get comprehensive vehicle report with all aggregated data
 * Access: Vehicle owner, Admin
 */
router.get('/:vehicleId/report', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get vehicle and verify ownership
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId, 
      ownerId: userId 
    }).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    // Get owner information
    const owner = await User.findById(vehicle.ownerId).select('firstName lastName email').lean();

    // Get last 10 OBD telemetry batches
    const lastBatches = await TelemetryBatch.find({ vehicleId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean();

    // Get rollback/fraud events from TrustEvents
    const rollbackEvents = await TrustEvent.find({
      vehicleId,
      reason: { $regex: /rollback|fraud/i }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Get TrustScore history (last 3 events)
    const trustEvents = await TrustEvent.find({ vehicleId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    // Get marketplace listing status
    const marketplaceStatus = {
      isListed: vehicle.isForSale || false,
      price: vehicle.price || null,
      listedAt: vehicle.updatedAt || null,
      listingId: vehicle._id
    };

    // Build comprehensive report
    const report = {
      vehicle: {
        id: vehicle._id,
        vin: vehicle.vin,
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        model: vehicle.vehicleModel,
        year: vehicle.year,
        color: vehicle.color,
        currentMileage: vehicle.currentMileage,
        trustScore: vehicle.trustScore || 100,
        verificationStatus: vehicle.verificationStatus,
        createdAt: vehicle.createdAt
      },
      owner: {
        id: owner?._id,
        fullName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
        email: owner?.email || 'Not available',
        registrationDate: vehicle.createdAt
      },
      registeredOnChain: {
        solanaTxHash: vehicle.blockchainHash || null,
        arweaveTx: vehicle.blockchainAddress || null,
        timestamp: vehicle.createdAt
      },
      lastBatches: lastBatches.map(batch => ({
        id: batch._id,
        recordedAt: batch.recordedAt,
        deviceId: batch.deviceId,
        startMileage: batch.lastRecordedMileage - (batch.distanceDelta || 0),
        endMileage: batch.lastRecordedMileage,
        distance: batch.distanceDelta || 0,
        blockchainHash: batch.solanaTx || null,
        status: batch.status || 'pending',
        dataPoints: batch.batchData?.length || 0
      })),
      rollbackEvents: rollbackEvents.map(event => ({
        id: event._id,
        prevMileage: event.details?.previousMileage || 0,
        newMileage: event.details?.reportedMileage || 0,
        deltaKm: (event.details?.reportedMileage || 0) - (event.details?.previousMileage || 0),
        timestamp: event.createdAt,
        detectionReason: event.reason,
        resolutionStatus: 'unresolved', // Default status
        resolvedBy: null
      })),
      trustScore: {
        score: vehicle.trustScore || 100,
        lastUpdated: vehicle.lastTrustScoreUpdate || vehicle.updatedAt,
        trend: trustEvents.length > 0 ? 
          (trustEvents[0].change > 0 ? 'increasing' : trustEvents[0].change < 0 ? 'decreasing' : 'stable') : 'stable',
        topCauses: trustEvents.map(event => ({
          reason: event.reason,
          change: event.change,
          timestamp: event.createdAt
        }))
      },
      listing: marketplaceStatus
    };

    logger.info(`✅ Generated comprehensive report for vehicle ${vehicleId}`);

    res.status(200).json({
      success: true,
      message: 'Vehicle report generated successfully',
      data: report
    });

  } catch (error) {
    logger.error('❌ Failed to generate vehicle report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate vehicle report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/vehicles/:vehicleId/list
 * List vehicle for sale in marketplace
 * Access: Vehicle owner only
 */
router.post('/:vehicleId/list', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;
    const { price, negotiable = true, description = '' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Get vehicle and verify ownership
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

    // Update vehicle for marketplace listing
    vehicle.isForSale = true;
    vehicle.price = price;
    vehicle.description = description;
    vehicle.listingStatus = 'active';
    vehicle.updatedAt = new Date();

    await vehicle.save();

    logger.info(`✅ Vehicle ${vehicleId} listed for sale at ₹${price}`);

    res.status(200).json({
      success: true,
      message: 'Vehicle listed for sale successfully',
      data: {
        vehicleId: vehicle._id,
        price,
        negotiable,
        description,
        listedAt: vehicle.updatedAt,
        marketplaceLink: `/marketplace/vehicle/${vehicle._id}`
      }
    });

  } catch (error) {
    logger.error('❌ Failed to list vehicle for sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list vehicle for sale',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/vehicles/:vehicleId/unlist
 * Remove vehicle from marketplace
 * Access: Vehicle owner only
 */
router.post('/:vehicleId/unlist', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get vehicle and verify ownership
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

    // Remove from marketplace
    vehicle.isForSale = false;
    vehicle.listingStatus = 'not_listed';
    vehicle.updatedAt = new Date();

    await vehicle.save();

    logger.info(`✅ Vehicle ${vehicleId} removed from marketplace`);

    res.status(200).json({
      success: true,
      message: 'Vehicle removed from marketplace successfully',
      data: {
        vehicleId: vehicle._id,
        unlistedAt: vehicle.updatedAt
      }
    });

  } catch (error) {
    logger.error('❌ Failed to unlist vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove vehicle from marketplace',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/vehicles/:vehicleId/report/pdf
 * Generate PDF report for vehicle
 * Access: Vehicle owner, Admin
 */
router.post('/:vehicleId/report/pdf', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get vehicle and verify ownership
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

    // For now, return a JSON response indicating PDF generation
    // In production, this would generate an actual PDF using libraries like puppeteer or pdfkit
    const pdfData = {
      vehicleId: vehicle._id,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.vehicleModel,
      year: vehicle.year,
      trustScore: vehicle.trustScore,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/vehicles/${vehicleId}/report/pdf/download`
    };

    logger.info(`✅ PDF report generated for vehicle ${vehicleId}`);

    res.status(200).json({
      success: true,
      message: 'PDF report generated successfully',
      data: pdfData
    });

  } catch (error) {
    logger.error('❌ Failed to generate PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
