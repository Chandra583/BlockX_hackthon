import { logger } from '../utils/logger';
import { TelemetryBatch } from '../models/TelemetryBatch.model';
import { VehicleTelemetry } from '../models/core/VehicleTelemetry.model';
import Vehicle from '../models/core/Vehicle.model';
import { Device } from '../models/core/Device.model';
import { getArweaveService } from './blockchain/arweave.service';
import { getSolanaService } from './blockchain/solana.service';
import { MerkleTreeBuilder } from '../utils/merkle';
import { walletService } from './blockchain/wallet.service';
import mongoose from 'mongoose';

export interface ConsolidationResult {
  success: boolean;
  batchId?: string;
  arweaveTx?: string;
  solanaTx?: string;
  merkleRoot?: string;
  error?: string;
}

export class TelemetryConsolidationService {
  
  /**
   * Consolidate daily telemetry data for a vehicle
   * Called when day ends or manually triggered
   */
  static async consolidateDayBatch(
    vehicleId: string,
    date: string
  ): Promise<ConsolidationResult> {
    // Ensure we can reference the batch in the catch block
    let existingBatch: any | null = null;
    try {
      logger.info(`🔄 Consolidating daily batch for vehicle ${vehicleId} on ${date}`);
      
      // Validate inputs
      if (!vehicleId || !date) {
        throw new Error('VehicleId and date are required');
      }
      
      // Check if batch already exists and is anchored
      existingBatch = await TelemetryBatch.findOne({
        vehicleId: new mongoose.Types.ObjectId(vehicleId),
        date
      });
      
      if (existingBatch && existingBatch.solanaTx) {
        logger.info(`✅ Batch already anchored for ${vehicleId} on ${date}`);
        return {
          success: true,
          batchId: existingBatch._id.toString(),
          arweaveTx: existingBatch.arweaveTx,
          solanaTx: existingBatch.solanaTx,
          merkleRoot: existingBatch.merkleRoot
        };
      }
      
      // Get vehicle info
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        logger.error(`❌ Vehicle not found: ${vehicleId}`);
        throw new Error(`Vehicle ${vehicleId} not found`);
      }

      // Query telemetry segments for the day (robust: try multiple selectors)
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      const queries: any[] = [
        // 1) By vehicle ObjectId and rawData.timestamp (ms epoch)
        {
          filter: {
            vehicle: vehicleId,
            'rawData.timestamp': { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() }
          },
          sort: { 'rawData.timestamp': 1 },
          label: 'vehicle + rawData.timestamp(ms)'
        },
        // 2) By VIN and rawData.timestamp
        {
          filter: {
            vin: vehicle.vin,
            'rawData.timestamp': { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() }
          },
          sort: { 'rawData.timestamp': 1 },
          label: 'vin + rawData.timestamp(ms)'
        },
        // 3) By deviceID (linked device) and rawData.timestamp
        {
          filter: async () => {
            const dev = await Device.findOne({ vehicle: vehicleId });
            return dev?.deviceID
              ? { deviceID: dev.deviceID, 'rawData.timestamp': { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() } }
              : null;
          },
          sort: { 'rawData.timestamp': 1 },
          label: 'deviceID + rawData.timestamp(ms)'
        },
        // 4) By vehicle and rawData.receivedAt (Date)
        {
          filter: {
            vehicle: vehicleId,
            'rawData.receivedAt': { $gte: startOfDay, $lte: endOfDay }
          },
          sort: { 'rawData.receivedAt': 1 },
          label: 'vehicle + rawData.receivedAt(Date)'
        },
        // 5) By VIN and rawData.receivedAt (Date)
        {
          filter: {
            vin: vehicle.vin,
            'rawData.receivedAt': { $gte: startOfDay, $lte: endOfDay }
          },
          sort: { 'rawData.receivedAt': 1 },
          label: 'vin + rawData.receivedAt(Date)'
        },
        // 6) By vehicle and createdAt (Date)
        {
          filter: {
            vehicle: vehicleId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          },
          sort: { createdAt: 1 },
          label: 'vehicle + createdAt(Date)'
        }
      ];

      let telemetryRecords: any[] = [];
      for (const q of queries) {
        const filter = typeof q.filter === 'function' ? await q.filter() : q.filter;
        if (!filter) continue;
        telemetryRecords = await VehicleTelemetry.find(filter).sort(q.sort);
        if (telemetryRecords.length > 0) {
          logger.info(`📥 Found ${telemetryRecords.length} telemetry records using selector: ${q.label}`);
          break;
        }
      }

      // 7) Fallback: try +/- 1 day window if still empty (time zone drift)
      if (telemetryRecords.length === 0) {
        const fallbackStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
        const fallbackEnd = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000);
        telemetryRecords = await VehicleTelemetry.find({
          $or: [ { vehicle: vehicleId }, { vin: vehicle.vin } ],
          $orTimestamp: 1,
          $and: [
            { $or: [
              { 'rawData.timestamp': { $gte: fallbackStart.getTime(), $lte: fallbackEnd.getTime() } },
              { 'rawData.receivedAt': { $gte: fallbackStart, $lte: fallbackEnd } },
              { createdAt: { $gte: fallbackStart, $lte: fallbackEnd } }
            ] }
          ]
        } as any).sort({ 'rawData.timestamp': 1 });
        if (telemetryRecords.length > 0) {
          logger.warn(`⏱️ Using +/-1 day fallback; found ${telemetryRecords.length} telemetry records.`);
        }
      }
      
      if (telemetryRecords.length === 0) {
        logger.info(`📭 No telemetry data found for ${vehicleId} on ${date}`);
        return {
          success: false,
          error: 'No telemetry data for this date'
        };
      }
      
      // Resolve deviceId from Device record or telemetry fallback
      let deviceIdStr: string | undefined;
      let installId: mongoose.Types.ObjectId | undefined;
      const device = await Device.findOne({ vehicle: vehicleId });
      if (device) {
        deviceIdStr = device.deviceID;
        installId = device.installationRequest?.requestedBy || vehicle.ownerId;
        logger.info(`✅ Using linked device ${deviceIdStr} for vehicle ${vehicle.vin}`);
      } else {
        deviceIdStr = telemetryRecords[0]?.deviceID;
        installId = vehicle.ownerId;
        logger.warn(`⚠️ No device linked to vehicle ${vehicleId}. Falling back to deviceID from telemetry: ${deviceIdStr}`);
      }
      
      // Process segments
      const segments = this.processTelemetrySegments(telemetryRecords);
      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
      
      // Build Merkle tree
      const merkleTree = MerkleTreeBuilder.buildTree(segments);
      const merkleRoot = merkleTree.root.hash;
      
      logger.info(`🌳 Built Merkle tree with root: ${merkleRoot}`);
      
      // Create or update batch record
      let batch;
      if (existingBatch) {
        batch = existingBatch;
        batch.status = 'consolidating';
        batch.segments = segments;
        batch.totalDistance = totalDistance;
        batch.segmentsCount = segments.length;
        batch.merkleRoot = merkleRoot;
      } else {
        batch = new TelemetryBatch({
          installId: installId || new mongoose.Types.ObjectId(),
          vehicleId: new mongoose.Types.ObjectId(vehicleId),
          deviceId: deviceIdStr,
          date,
          segments,
          totalDistance,
          segmentsCount: segments.length,
          merkleRoot,
          status: 'consolidating',
          lastRecordedMileage: vehicle.mileage,
          distanceDelta: totalDistance,
          recordedAt: new Date()
        });
      }
      
      await batch.save();
      
      // Upload to Arweave (optional - continue if fails)
      try {
        const arweaveResult = await this.uploadToArweave(batch, segments);
        if (arweaveResult.success) {
          batch.arweaveTx = arweaveResult.transactionId!;
          await batch.save();
          logger.info(`✅ Uploaded to Arweave: ${arweaveResult.transactionId}`);
        } else {
          logger.warn(`⚠️ Arweave upload failed: ${arweaveResult.error}`);
        }
      } catch (arweaveError) {
        logger.warn(`⚠️ Arweave upload error:`, arweaveError);
      }
      
      // Anchor to Solana (optional - continue if fails)
      try {
        const solanaResult = await this.anchorToSolana(batch, vehicle);
        if (solanaResult.success) {
          batch.solanaTx = solanaResult.transactionHash!;
          batch.status = 'anchored';
          await batch.save();
          logger.info(`✅ Anchored to Solana: ${solanaResult.transactionHash}`);
        } else {
          logger.warn(`⚠️ Solana anchoring failed: ${solanaResult.error}`);
          batch.status = 'error';
          batch.lastError = solanaResult.error;
          await batch.save();
        }
      } catch (solanaError) {
        logger.warn(`⚠️ Solana anchoring error:`, solanaError);
        batch.status = 'error';
        batch.lastError = solanaError instanceof Error ? solanaError.message : 'Unknown error';
        await batch.save();
      }
      
      logger.info(`✅ Daily batch consolidated for ${vehicleId} on ${date}`);
      
      return {
        success: true,
        batchId: batch._id.toString(),
        arweaveTx: batch.arweaveTx || null,
        solanaTx: batch.solanaTx || null,
        merkleRoot: batch.merkleRoot
      };
      
    } catch (error) {
      logger.error(`❌ Failed to consolidate daily batch:`, error);
      
      // Update batch status to error
      if (existingBatch) {
        existingBatch.status = 'error';
        existingBatch.lastError = error instanceof Error ? error.message : 'Unknown error';
        await existingBatch.save();
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Process telemetry records into segments
   */
  private static processTelemetrySegments(records: any[]): Array<{
    startTime: Date;
    endTime: Date;
    distance: number;
    rawDataCID?: string;
  }> {
    const segments: Array<{
      startTime: Date;
      endTime: Date;
      distance: number;
      rawDataCID?: string;
    }> = [];
    
    let currentSegment: any = null;
    
    for (const record of records) {
      const timestamp = new Date(record.rawData.timestamp);
      const mileage = record.obd?.mileage || 0;
      
      if (!currentSegment) {
        // Start new segment
        currentSegment = {
          startTime: timestamp,
          endTime: timestamp,
          startMileage: mileage,
          endMileage: mileage,
          distance: 0
        };
      } else {
        // Update segment
        currentSegment.endTime = timestamp;
        currentSegment.endMileage = mileage;
        currentSegment.distance = Math.max(0, mileage - currentSegment.startMileage);
      }
      
      // Check if segment should be closed (gap > 30 minutes or end of day)
      const timeDiff = timestamp.getTime() - currentSegment.endTime.getTime();
      const isEndOfDay = timestamp.getHours() === 23 && timestamp.getMinutes() >= 59;
      
      if (timeDiff > 30 * 60 * 1000 || isEndOfDay) {
        // Close current segment
        segments.push({
          startTime: currentSegment.startTime,
          endTime: currentSegment.endTime,
          distance: currentSegment.distance
        });
        
        // Start new segment if not end of day
        if (!isEndOfDay) {
          currentSegment = {
            startTime: timestamp,
            endTime: timestamp,
            startMileage: mileage,
            endMileage: mileage,
            distance: 0
          };
        }
      }
    }
    
    // Close final segment
    if (currentSegment) {
      segments.push({
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        distance: currentSegment.distance
      });
    }
    
    return segments;
  }
  
  /**
   * Upload batch data to Arweave
   */
  private static async uploadToArweave(
    batch: any,
    segments: any[]
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const arweaveService = getArweaveService();
      
      const batchData = {
        vehicleId: batch.vehicleId.toString(),
        deviceId: batch.deviceId,
        date: batch.date,
        segments,
        totalDistance: batch.totalDistance,
        segmentsCount: batch.segmentsCount,
        merkleRoot: batch.merkleRoot,
        consolidatedAt: new Date().toISOString()
      };
      
      const result = await arweaveService.uploadData({
        data: JSON.stringify(batchData, null, 2),
        contentType: 'application/json',
        fileName: `telemetry_batch_${batch.vehicleId}_${batch.date}.json`,
        vehicleId: batch.vehicleId.toString(),
        documentType: 'telemetry_batch',
        metadata: {
          batchId: batch._id.toString(),
          date: batch.date,
          segmentsCount: batch.segmentsCount
        }
      });
      
      return {
        success: true,
        transactionId: result.transactionId
      };
      
    } catch (error) {
      logger.error('❌ Arweave upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Anchor batch to Solana blockchain
   */
  private static async anchorToSolana(
    batch: any,
    vehicle: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const solanaService = getSolanaService();
      
      // Get owner's wallet
      const ownerWallet = await walletService.getUserWallet(vehicle.ownerId.toString());
      if (!ownerWallet) {
        throw new Error('Owner wallet not found');
      }
      
      // Create Solana transaction data
      const solanaData = {
        vehicleId: batch.vehicleId.toString(),
        vin: vehicle.vin,
        date: batch.date,
        merkleRoot: batch.merkleRoot,
        arweaveTx: batch.arweaveTx,
        totalDistance: batch.totalDistance,
        segmentsCount: batch.segmentsCount,
        timestamp: Date.now(),
        action: 'ANCHOR_TELEMETRY_BATCH'
      };
      
      // Use existing Solana service to record the batch
      const result = await solanaService.recordMileage(
        batch.vehicleId.toString(),
        vehicle.vin,
        batch.totalDistance,
        0, // previous distance
        'system',
        'automated',
        ownerWallet
      );
      
      return {
        success: true,
        transactionHash: result.transactionHash
      };
      
    } catch (error) {
      logger.error('❌ Solana anchoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Process all pending batches (cron job)
   */
  static async processPendingBatches(): Promise<void> {
    try {
      logger.info('🔄 Processing pending telemetry batches...');
      
      const pendingBatches = await TelemetryBatch.find({
        status: { $in: ['pending', 'error'] }
      }).limit(10);
      
      for (const batch of pendingBatches) {
        try {
          await this.consolidateDayBatch(
            batch.vehicleId.toString(),
            batch.date
          );
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          logger.error(`❌ Failed to process batch ${batch._id}:`, error);
        }
      }
      
      logger.info(`✅ Processed ${pendingBatches.length} pending batches`);
      
    } catch (error) {
      logger.error('❌ Failed to process pending batches:', error);
    }
  }
}
