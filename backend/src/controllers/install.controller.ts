import { Request, Response } from 'express';
import { InstallationRequest } from '../models/InstallationRequest.model';
import Vehicle from '../models/core/Vehicle.model';
import { User } from '../models/core/User.model';
import { TelemetryBatch } from '../models/TelemetryBatch.model';
import { getAnchorService } from '../services/anchor.service';
import { logger } from '../utils/logger';
import { emitEvent, emitToUser } from '../utils/socketEmitter';
import mongoose from 'mongoose';

const anchorService = getAnchorService();

/**
 * Start installation
 * POST /api/service/install/start
 */
export const startInstallation = async (req: Request, res: Response) => {
  try {
    const { installId, deviceId, initialMileage } = req.body;
    const serviceProviderId = (req as any).user?.id;

    // Validate required fields
    if (!installId || !deviceId || initialMileage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: installId, deviceId, initialMileage'
      });
    }

    // Check if this deviceId is already in use by another active installation
    const existingActiveInstallation = await InstallationRequest.findOne({
      deviceId: deviceId.toString(),
      status: { $in: ['in_progress', 'completed'] },
      _id: { $ne: installId } // Exclude the current installation being started
    });

    if (existingActiveInstallation) {
      return res.status(400).json({
        success: false,
        message: `Device ID '${deviceId}' is already assigned to an active or completed installation.`
      });
    }

    // Also check if a TelemetryBatch already exists for this deviceId and is not associated with the current installId
    const existingTelemetryBatch = await TelemetryBatch.findOne({
      deviceId: deviceId.toString(),
      installId: { $ne: installId } // Exclude telemetry batches for the current installation
    });

    if (existingTelemetryBatch) {
      return res.status(400).json({
        success: false,
        message: `Device ID '${deviceId}' has existing telemetry data not associated with this installation. Please use a different device ID.`
      });
    }

    // Verify installation request exists and is assigned to caller
    const install = await InstallationRequest.findById(installId);
    if (!install) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Verify this service provider is assigned to this installation
    if (install.serviceProviderId?.toString() !== serviceProviderId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Installation not assigned to this service provider.'
      });
    }

    // Verify installation status
    if (install.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Installation must be in assigned status to start'
      });
    }

    // Get vehicle details
    const vehicle = await Vehicle.findById(install.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Validate initial mileage against last verified mileage
    if (initialMileage < (vehicle.lastVerifiedMileage || 0)) {
      // Set status to flagged
      install.status = 'flagged';
      install.history.push({
        action: 'flagged',
        by: serviceProviderId,
        at: new Date(),
        meta: { 
          reason: 'Initial mileage less than last verified mileage',
          initialMileage,
          lastVerifiedMileage: vehicle.lastVerifiedMileage
        }
      });
      
      await install.save();
      
      // Emit socket event
      emitEvent('install_flagged', {
        installId: install._id,
        vehicleId: vehicle._id,
        reason: 'Initial mileage less than last verified mileage',
        initialMileage,
        lastVerifiedMileage: vehicle.lastVerifiedMileage
      });

      return res.status(400).json({
        success: false,
        flagged: true,
        message: 'Initial mileage is less than last verified mileage. Installation flagged for review.',
        data: {
          initialMileage,
          lastVerifiedMileage: vehicle.lastVerifiedMileage
        }
      });
    }

    // Create telemetry batch snapshot
    try {
      const telemetryBatch = new TelemetryBatch({
        installId: install._id,
        vehicleId: vehicle._id,
        deviceId: deviceId.toString(), // Ensure deviceId is a string
        lastRecordedMileage: initialMileage,
        distanceDelta: 0,
        batchData: [],
        recordedAt: new Date()
      });

      await telemetryBatch.save();
      logger.info(`✅ TelemetryBatch created for install ${install._id} with device ${deviceId}`);
    } catch (telemetryError) {
      logger.error('❌ Failed to create TelemetryBatch:', telemetryError);
      
      // If it's a duplicate key error, try to find and remove the conflicting record
      if (telemetryError.code === 11000) {
        logger.info('🔧 Attempting to clean up conflicting TelemetryBatch records...');
        await TelemetryBatch.deleteMany({
          deviceId: null,
          recordedAt: null
        });
        
        // Try again
        const telemetryBatch = new TelemetryBatch({
          installId: install._id,
          vehicleId: vehicle._id,
          deviceId: deviceId.toString(),
          lastRecordedMileage: initialMileage,
          distanceDelta: 0,
          batchData: [],
          recordedAt: new Date()
        });
        
        await telemetryBatch.save();
        logger.info(`✅ TelemetryBatch created after cleanup for install ${install._id}`);
      } else {
        throw telemetryError;
      }
    }

    // Anchor install event
    // Fetch owner and service provider details for Solana payload
    const ownerData = await User.findById(install.ownerId).select('firstName lastName email');
    const serviceProviderData = await User.findById(install.serviceProviderId).select('firstName lastName email');
    
    // Get owner's wallet using wallet service (properly decrypts the private key)
    const { getWalletService } = await import('../services/blockchain/wallet.service');
    const walletService = getWalletService();
    const ownerWallet = await walletService.getUserWallet(install.ownerId.toString());
    
    if (!ownerWallet) {
      return res.status(400).json({
        success: false,
        message: 'Owner wallet not found. Cannot anchor installation to blockchain.'
      });
    }
    
    logger.info('📋 Owner Data for Solana:', JSON.stringify(ownerData, null, 2));
    logger.info('📋 Service Provider Data for Solana:', JSON.stringify(serviceProviderData, null, 2));
    logger.info('🔍 Owner wallet address:', ownerWallet.publicKey);
    logger.info('🔍 Owner wallet secret key length:', ownerWallet.secretKey.length);
    logger.info('📋 Vehicle Data for Solana:', JSON.stringify({
      vin: vehicle.vin,
      vehicleNumber: vehicle.vehicleNumber,
      make: vehicle.make,
      model: vehicle.vehicleModel,
      year: vehicle.year
    }, null, 2));
    
    const anchorResult = await anchorService.anchorInstallEvent(install, vehicle, ownerData, serviceProviderData, ownerWallet);
    
    if (!anchorResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to anchor installation event',
        error: anchorResult.message
      });
    }

    // Update installation
    install.startedAt = new Date();
    install.deviceId = deviceId?.toString();
    install.initialMileage = initialMileage;
    install.status = 'in_progress';
    install.solanaTx = anchorResult.solanaTx;
    install.arweaveTx = anchorResult.arweaveTx;
    install.history.push({
      action: 'started',
      by: serviceProviderId,
      at: new Date(),
      meta: { 
        deviceId,
        initialMileage,
        solanaTx: anchorResult.solanaTx,
        arweaveTx: anchorResult.arweaveTx
      }
    });

    await install.save();

    // Update vehicle with last verified mileage
    vehicle.lastVerifiedMileage = initialMileage;
    await vehicle.save();

    // Add to vehicle history
    vehicle.mileageHistory.push({
      mileage: initialMileage,
      recordedBy: serviceProviderId,
      recordedAt: new Date(),
      source: 'service',
      notes: 'Installation started'
    });
    await vehicle.save();

    // Emit socket event
    emitEvent('install_started', {
      installId: install._id,
      vehicleId: vehicle._id,
      deviceId,
      initialMileage,
      solanaTx: anchorResult.solanaTx,
      arweaveTx: anchorResult.arweaveTx
    });

    logger.info(`✅ Installation ${installId} started with device ${deviceId}`);

    res.status(200).json({
      success: true,
      message: 'Installation started successfully',
      data: {
        installId: install._id,
        status: install.status,
        deviceId: install.deviceId,
        initialMileage: install.initialMileage,
        startedAt: install.startedAt,
        solanaTx: anchorResult.solanaTx,
        arweaveTx: anchorResult.arweaveTx,
        arweaveUrl: anchorResult.arweaveTx ? `https://arweave.net/${anchorResult.arweaveTx}` : undefined,
        solanaUrl: anchorResult.solanaTx ? `https://explorer.solana.com/tx/${anchorResult.solanaTx}${process.env.NODE_ENV !== 'production' ? '?cluster=devnet' : ''}` : undefined,
        // Include enriched payload echo for client visibility
        payload: {
          vehicleNumber: vehicle.vehicleNumber,
          vin: vehicle.vin,
          ownerName: `${(ownerData as any)?.firstName || ''} ${(ownerData as any)?.lastName || ''}`.trim(),
          ownerId: install.ownerId,
          serviceProviderId: install.serviceProviderId,
          assignedId: install._id
        }
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start installation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start installation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Complete installation
 * POST /api/service/install/complete
 */
export const completeInstallation = async (req: Request, res: Response) => {
  try {
    const { installId, finalNotes } = req.body;
    const serviceProviderId = (req as any).user?.id;

    // Validate required fields
    if (!installId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: installId'
      });
    }

    // Verify installation request exists
    const install = await InstallationRequest.findById(installId);
    if (!install) {
      return res.status(404).json({
        success: false,
        message: 'Installation request not found'
      });
    }

    // Verify this service provider is assigned to this installation
    if (install.serviceProviderId?.toString() !== serviceProviderId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Installation not assigned to this service provider.'
      });
    }

    // Verify installation status
    if (install.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Installation must be in progress to complete'
      });
    }

    // Update installation
    install.completedAt = new Date();
    install.status = 'completed';
    if (finalNotes) {
      install.notes = finalNotes;
    }
    install.history.push({
      action: 'completed',
      by: serviceProviderId,
      at: new Date(),
      meta: { finalNotes }
    });

    await install.save();

    // Emit socket event
    emitEvent('install_completed', {
      installId: install._id,
      vehicleId: install.vehicleId,
      completedAt: install.completedAt
    });

    logger.info(`✅ Installation ${installId} completed`);

    res.status(200).json({
      success: true,
      message: 'Installation completed successfully',
      data: {
        installId: install._id,
        status: install.status,
        completedAt: install.completedAt,
        deviceId: install.deviceId,
        finalNotes: install.notes,
        solanaTx: install.solanaTx,
        arweaveTx: install.arweaveTx,
        blockchainUrls: {
          solanaUrl: install.solanaTx ? `https://explorer.solana.com/tx/${install.solanaTx}` : null,
          arweaveUrl: install.arweaveTx ? `https://arweave.net/${install.arweaveTx}` : null
        }
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

/**
 * Assign installation (admin only)
 * POST /api/admin/assign-install
 */
export const assignInstallation = async (req: Request, res: Response) => {
  try {
    const { installId, serviceProviderId } = req.body;
    const adminId = (req as any).user?.id;


    // Validate required fields
    if (!installId || !serviceProviderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: installId, serviceProviderId'
      });
    }

    // Verify target user exists and has service provider role
    const serviceProvider = await User.findById(serviceProviderId);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    if (serviceProvider.role !== 'service') {
      return res.status(400).json({
        success: false,
        message: 'User is not a service provider'
      });
    }

    // Cast serviceProviderId to ObjectId for proper type matching
    const spObjectId = new mongoose.Types.ObjectId(serviceProviderId);
    const adminObjectId = new mongoose.Types.ObjectId(adminId);


    // Use atomic update to assign installation
    // Handle both 'requested' and 'pending' status values for compatibility
    const updated = await InstallationRequest.findOneAndUpdate(
      { 
        _id: installId, 
        status: { $in: ['requested', 'pending'] },
        $or: [
          { serviceProviderId: { $exists: false } },
          { serviceProviderId: null }
        ]
      },
      { 
        $set: { 
          serviceProviderId: spObjectId, 
          assignedAt: new Date(), 
          status: 'assigned' 
        },
        $push: {
          history: {
            action: 'assigned',
            by: adminObjectId,
            at: new Date(),
            meta: { serviceProviderId: spObjectId }
          }
        }
      },
      { new: true, runValidators: true }
    );


    // If updated is null, the install was not found or was already assigned
    if (!updated) {
      // Check if install exists but is already assigned
      const existingInstall = await InstallationRequest.findById(installId);
      if (existingInstall) {
        if (existingInstall.serviceProviderId) {
          return res.status(409).json({
            success: false,
            message: 'Installation already assigned to a service provider',
            data: {
              serviceProviderId: existingInstall.serviceProviderId,
              assignedAt: existingInstall.assignedAt
            }
          });
        } else {
          return res.status(409).json({
            success: false,
            message: 'Installation is not in a state that allows assignment',
            data: {
              status: existingInstall.status
            }
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'Installation request not found'
        });
      }
    }

    logger.info(`✅ Installation ${installId} assigned to service provider ${serviceProviderId}`);

    // Emit websocket event to the assigned service provider
    emitToUser(serviceProviderId, 'install_assigned', {
      installId: updated._id,
      status: updated.status,
      assignedAt: updated.assignedAt,
      vehicleId: updated.vehicleId
    });

    res.status(200).json({
      success: true,
      message: 'Installation assigned successfully',
      data: {
        installId: updated._id,
        status: updated.status,
        assignedAt: updated.assignedAt,
        serviceProviderId: updated.serviceProviderId
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