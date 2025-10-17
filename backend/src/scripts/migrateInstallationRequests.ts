#!/usr/bin/env node

/**
 * Migration Script: Installation Requests
 * 
 * This script migrates existing installation requests from the old Install model
 * to the new InstallationRequest model with enhanced schema and history tracking.
 */

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { Install } from '../models/Install.model';
import { InstallationRequest } from '../models/InstallationRequest.model';
import { logger } from '../utils/logger';

// Connect to database
mongoose.connect(config.MONGODB_URI);

const migrateInstallationRequests = async () => {
  try {
    logger.info('🚀 Starting installation request migration...');
    
    // Get all existing installation requests
    const oldRequests = await Install.find({}).lean();
    logger.info(`📋 Found ${oldRequests.length} existing installation requests`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Process each request
    for (const oldRequest of oldRequests) {
      try {
        // Check if already migrated
        const exists = await InstallationRequest.exists({ _id: oldRequest._id });
        if (exists) {
          logger.info(`⏭️  Skipping already migrated request ${oldRequest._id}`);
          continue;
        }
        
        // Map old fields to new schema
        const newRequest = new InstallationRequest({
          _id: oldRequest._id,
          ownerId: oldRequest.ownerId,
          vehicleId: oldRequest.vehicleId,
          requestedBy: oldRequest.ownerId, // Assume owner is requester in old model
          deviceId: oldRequest.deviceId,
          serviceProviderId: oldRequest.serviceProviderId,
          status: oldRequest.status,
          notes: oldRequest.notes,
          createdAt: oldRequest.requestedAt,
          updatedAt: (oldRequest as any).updatedAt || oldRequest.requestedAt,
          installedAt: oldRequest.completedAt,
          history: []
        });
        
        // Add history entries based on status changes
        newRequest.history.push({
          action: 'created',
          by: oldRequest.ownerId,
          at: oldRequest.requestedAt
        });
        
        if (oldRequest.assignedAt) {
          newRequest.history.push({
            action: 'assigned',
            by: oldRequest.serviceProviderId || oldRequest.ownerId,
            at: oldRequest.assignedAt
          });
        }
        
        if (oldRequest.completedAt) {
          newRequest.history.push({
            action: 'completed',
            by: oldRequest.serviceProviderId || oldRequest.ownerId,
            at: oldRequest.completedAt
          });
        }
        
        // Save new request
        await newRequest.save();
        migratedCount++;
        
        logger.info(`✅ Migrated installation request ${oldRequest._id}`);
      } catch (error) {
        errorCount++;
        logger.error(`❌ Failed to migrate installation request ${oldRequest._id}:`, error);
      }
    }
    
    logger.info(`🏁 Migration complete! Successfully migrated ${migratedCount} requests, ${errorCount} errors`);
    
    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration if script is called directly
if (require.main === module) {
  migrateInstallationRequests();
}

export default migrateInstallationRequests;