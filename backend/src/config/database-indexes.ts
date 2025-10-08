import mongoose from 'mongoose';
import { Vehicle, MileageHistory, VehicleDocument } from '../models';

/**
 * Database Index Configuration for Phase 2 Vehicle Management System
 */

export class DatabaseIndexManager {
  /**
   * Create all database indexes for Phase 2 models
   */
  static async createAllIndexes(): Promise<void> {
    try {
      console.log('🔍 Creating database indexes for Phase 2 models...');
      
      await Promise.all([
        this.createVehicleIndexes(),
        this.createMileageHistoryIndexes(),
        this.createVehicleDocumentIndexes()
      ]);
      
      console.log('✅ All database indexes created successfully!');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  /**
   * Create indexes for Vehicle collection
   */
  private static async createVehicleIndexes(): Promise<void> {
    console.log('  📋 Creating Vehicle indexes...');
    
    const indexes: any[] = [
      // Single field indexes
      { vin: 1 },
      { ownerId: 1 },
      { make: 1 },
      { model: 1 },
      { year: 1 },
      { bodyType: 1 },
      { fuelType: 1 },
      { isForSale: 1 },
      { listingStatus: 1 },
      { verificationStatus: 1 },
      { trustScore: -1 },
      { currentMileage: 1 },
      { createdAt: -1 },
      { updatedAt: -1 },
      
      // Compound indexes
      { make: 1, model: 1 },
      { make: 1, model: 1, year: 1 },
      { isForSale: 1, listingStatus: 1 },
      { isForSale: 1, trustScore: -1 },
      { verificationStatus: 1, trustScore: -1 }
    ];

    for (const index of indexes) {
      try {
        await Vehicle.collection.createIndex(index);
        console.log(`    ✓ Vehicle index created: ${JSON.stringify(index)}`);
      } catch (error: any) {
        console.warn(`    ⚠️  Vehicle index warning: ${JSON.stringify(index)} - ${error.message}`);
      }
    }
  }

  /**
   * Create indexes for MileageHistory collection
   */
  private static async createMileageHistoryIndexes(): Promise<void> {
    console.log('  📊 Creating MileageHistory indexes...');
    
    const indexes: any[] = [
      // Single field indexes
      { vehicleId: 1 },
      { vin: 1 },
      { recordedBy: 1 },
      { recordedAt: -1 },
      { createdAt: -1 },
      { source: 1 },
      { verified: 1 },
      { mileage: 1 },
      { mileageIncrease: -1 },
      
      // Compound indexes
      { vehicleId: 1, recordedAt: -1 },
      { vin: 1, recordedAt: -1 },
      { recordedBy: 1, recordedAt: -1 },
      { source: 1, verified: 1 },
      { source: 1, recordedAt: -1 },
      { verified: 1, recordedAt: -1 }
    ];

    for (const index of indexes) {
      try {
        await MileageHistory.collection.createIndex(index);
        console.log(`    ✓ MileageHistory index created: ${JSON.stringify(index)}`);
      } catch (error: any) {
        console.warn(`    ⚠️  MileageHistory index warning: ${JSON.stringify(index)} - ${error.message}`);
      }
    }
    
    // Create sparse indexes separately
    try {
      await MileageHistory.collection.createIndex({ blockchainHash: 1 }, { sparse: true });
      console.log('    ✓ MileageHistory sparse index created: blockchainHash');
    } catch (error: any) {
      console.warn(`    ⚠️  MileageHistory sparse index warning: ${error.message}`);
    }
  }

  /**
   * Create indexes for VehicleDocument collection
   */
  private static async createVehicleDocumentIndexes(): Promise<void> {
    console.log('  📄 Creating VehicleDocument indexes...');
    
    const indexes: any[] = [
      // Single field indexes
      { vehicleId: 1 },
      { vin: 1 },
      { uploadedBy: 1 },
      { documentType: 1 },
      { status: 1 },
      { verificationStatus: 1 },
      { accessLevel: 1 },
      { uploadedAt: -1 },
      { createdAt: -1 },
      { updatedAt: -1 },
      { fileName: 1 },
      { documentNumber: 1 },
      { fileSize: -1 },
      { downloadCount: -1 },
      
      // Compound indexes
      { vehicleId: 1, documentType: 1 },
      { vin: 1, documentType: 1 },
      { status: 1, verificationStatus: 1 },
      { uploadedBy: 1, uploadedAt: -1 },
      { documentType: 1, uploadedAt: -1 },
      { verificationStatus: 1, uploadedAt: -1 }
    ];

    for (const index of indexes) {
      try {
        await VehicleDocument.collection.createIndex(index);
        console.log(`    ✓ VehicleDocument index created: ${JSON.stringify(index)}`);
      } catch (error: any) {
        console.warn(`    ⚠️  VehicleDocument index warning: ${JSON.stringify(index)} - ${error.message}`);
      }
    }
    
    // Create sparse indexes separately
    try {
      await VehicleDocument.collection.createIndex({ expirationDate: 1 }, { sparse: true });
      await VehicleDocument.collection.createIndex({ issueDate: -1 }, { sparse: true });
      await VehicleDocument.collection.createIndex({ lastDownloadedAt: -1 }, { sparse: true });
      console.log('    ✓ VehicleDocument sparse indexes created');
    } catch (error: any) {
      console.warn(`    ⚠️  VehicleDocument sparse index warning: ${error.message}`);
    }
  }

  /**
   * Drop all indexes (useful for development/testing)
   */
  static async dropAllIndexes(): Promise<void> {
    try {
      console.log('🗑️  Dropping all Phase 2 indexes...');
      
      await Promise.all([
        Vehicle.collection.dropIndexes(),
        MileageHistory.collection.dropIndexes(),
        VehicleDocument.collection.dropIndexes()
      ]);
      
      console.log('✅ All indexes dropped successfully!');
    } catch (error) {
      console.error('❌ Error dropping indexes:', error);
      throw error;
    }
  }

  /**
   * Get index statistics for all collections
   */
  static async getIndexStats(): Promise<any> {
    try {
      const stats = {
        vehicle: await Vehicle.collection.indexInformation(),
        mileageHistory: await MileageHistory.collection.indexInformation(),
        vehicleDocument: await VehicleDocument.collection.indexInformation()
      };
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting index stats:', error);
      throw error;
    }
  }

  /**
   * Analyze query performance for common operations
   */
  static async analyzeQueryPerformance(): Promise<void> {
    console.log('📊 Analyzing query performance...');
    
    try {
      // Test common Vehicle queries
      const vehicleQueries = [
        { isForSale: true, trustScore: { $gte: 80 } },
        { make: 'Toyota', model: 'Camry' },
        { vin: 'TEST123456789012345' }
      ];

      for (const query of vehicleQueries) {
        try {
          const explain = await Vehicle.find(query).explain('executionStats') as any;
          console.log(`  Vehicle query ${JSON.stringify(query)}: ${explain.executionStats?.totalDocsExamined || 0} docs examined`);
        } catch (error) {
          console.log(`  Vehicle query ${JSON.stringify(query)}: Analysis failed`);
        }
      }

      // Test common MileageHistory queries
      const mileageQueries = [
        { source: 'government', verified: true },
        { recordedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ];

      for (const query of mileageQueries) {
        try {
          const explain = await MileageHistory.find(query).explain('executionStats') as any;
          console.log(`  MileageHistory query ${JSON.stringify(query)}: ${explain.executionStats?.totalDocsExamined || 0} docs examined`);
        } catch (error) {
          console.log(`  MileageHistory query ${JSON.stringify(query)}: Analysis failed`);
        }
      }

      console.log('✅ Query performance analysis complete!');
    } catch (error) {
      console.error('❌ Error analyzing query performance:', error);
    }
  }
}

export default DatabaseIndexManager; 