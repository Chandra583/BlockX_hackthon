import { logger } from '../../utils/logger';
import { ApiError, ValidationError, NotFoundError } from '../../utils/errors';
import { Vehicle, MileageHistory, User } from '../../models';
import { getSolanaService } from '../blockchain/solana.service';
import mongoose from 'mongoose';

export interface VehicleListingData {
  vehicleId: string;
  askingPrice: number;
  description?: string;
  features?: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  negotiable: boolean;
  contactPreference: 'phone' | 'email' | 'both';
  availableForInspection: boolean;
  inspectionLocation?: string;
}

export interface VehicleHistoryReport {
  vehicleInfo: {
    vin: string;
    make: string;
    model: string;
    year: number;
    currentMileage: number;
    trustScore: number;
    verificationStatus: string;
  };
  
  mileageHistory: {
    totalRecords: number;
    verifiedRecords: number;
    blockchainRecords: number;
    firstRecorded: Date;
    lastRecorded: Date;
    averageMonthlyMileage: number;
    mileagePattern: 'consistent' | 'irregular' | 'suspicious';
    records: Array<{
      date: Date;
      mileage: number;
      source: string;
      verified: boolean;
      blockchainHash?: string;
      location?: string;
    }>;
  };
  
  fraudAlerts: {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    criticalAlerts: number;
    alerts: Array<{
      type: string;
      severity: string;
      description: string;
      date: Date;
      status: string;
    }>;
  };
  
  serviceHistory: {
    totalServices: number;
    verifiedServices: number;
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    maintenanceScore: number;
    services: Array<{
      date: Date;
      type: string;
      description: string;
      mileage: number;
      cost: number;
      verified: boolean;
    }>;
  };
  
  accidentHistory: {
    totalAccidents: number;
    majorAccidents: number;
    lastAccidentDate?: Date;
    accidents: Array<{
      date: Date;
      severity: string;
      description: string;
      repairCost?: number;
      verified: boolean;
    }>;
  };
  
  blockchainVerification: {
    isOnBlockchain: boolean;
    totalTransactions: number;
    firstTransaction?: Date;
    lastTransaction?: Date;
    blockchainIntegrity: 'verified' | 'partial' | 'unverified';
    transactions: Array<{
      hash: string;
      date: Date;
      type: string;
      mileage?: number;
      verified: boolean;
    }>;
  };
  
  marketAnalysis: {
    estimatedValue: number;
    marketComparison: 'above_market' | 'at_market' | 'below_market';
    demandLevel: 'high' | 'medium' | 'low';
    similarVehicles: number;
    averageMarketPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
  };
  
  recommendations: {
    listingRecommendations: string[];
    priceRecommendations: string[];
    maintenanceRecommendations: string[];
    trustImprovements: string[];
  };
  
  reportMetadata: {
    generatedAt: Date;
    reportVersion: string;
    dataSourcesCount: number;
    confidenceLevel: number;
    validUntil: Date;
  };
}

export class MarketplaceService {
  
  /**
   * List vehicle for sale with automatic history report generation
   */
  static async listVehicleForSale(ownerId: string, listingData: VehicleListingData): Promise<any> {
    try {
      logger.info(`🏪 Listing vehicle for sale: ${listingData.vehicleId}`);
      
      // Validate vehicle ownership
      const vehicle = await Vehicle.findOne({
        _id: listingData.vehicleId,
        ownerId: ownerId
      });
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or not owned by user');
      }
      
      // Check if vehicle is already listed
      if (vehicle.isForSale && vehicle.listingStatus === 'active') {
        throw new ValidationError('Vehicle is already listed for sale');
      }
      
      // Generate comprehensive vehicle history report
      const historyReport = await this.generateVehicleHistoryReport(vehicle._id.toString());
      
      // Update vehicle listing status
      vehicle.isForSale = true;
      vehicle.listingStatus = 'active';
      vehicle.description = listingData.description || vehicle.description;
      vehicle.features = listingData.features || vehicle.features;
      vehicle.condition = listingData.condition;
      
      // Add marketplace-specific fields (these would be in a separate Listing model in production)
      const listingDetails = {
        askingPrice: listingData.askingPrice,
        negotiable: listingData.negotiable,
        contactPreference: listingData.contactPreference,
        availableForInspection: listingData.availableForInspection,
        inspectionLocation: listingData.inspectionLocation,
        listedAt: new Date(),
        historyReportGenerated: true,
        historyReport: historyReport
      };
      
      await vehicle.save();
      
      logger.info(`✅ Vehicle listed successfully with history report generated`);
      
      return {
        vehicle,
        listing: listingDetails,
        historyReport
      };
      
    } catch (error) {
      logger.error(`❌ Failed to list vehicle for sale:`, error);
      throw error;
    }
  }
  
  /**
   * Generate comprehensive vehicle history report
   */
  static async generateVehicleHistoryReport(vehicleId: string): Promise<VehicleHistoryReport> {
    try {
      logger.info(`📊 Generating vehicle history report for: ${vehicleId}`);
      
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      
      // Get mileage history
      const mileageRecords = await MileageHistory.find({ vehicleId })
        .sort({ recordedAt: -1 })
        .populate('recordedBy', 'firstName lastName role');
      
      // Analyze mileage history
      const mileageAnalysis = this.analyzeMileageHistory(mileageRecords);
      
      // Get blockchain verification data
      const blockchainData = await this.getBlockchainVerificationData(vehicle.vin);
      
      // Analyze fraud alerts
      const fraudAnalysis = this.analyzeFraudAlerts(vehicle.fraudAlerts);
      
      // Analyze service history
      const serviceAnalysis = this.analyzeServiceHistory(vehicle.serviceHistory);
      
      // Analyze accident history
      const accidentAnalysis = this.analyzeAccidentHistory(vehicle.accidentHistory);
      
      // Get market analysis
      const marketAnalysis = await this.getMarketAnalysisInternal(vehicle);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        vehicle,
        mileageAnalysis,
        fraudAnalysis,
        serviceAnalysis,
        marketAnalysis
      );
      
      const report: VehicleHistoryReport = {
        vehicleInfo: {
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.vehicleModel,
          year: vehicle.year,
          currentMileage: vehicle.currentMileage,
          trustScore: vehicle.trustScore,
          verificationStatus: vehicle.verificationStatus
        },
        
        mileageHistory: mileageAnalysis,
        fraudAlerts: fraudAnalysis,
        serviceHistory: serviceAnalysis,
        accidentHistory: accidentAnalysis,
        blockchainVerification: blockchainData,
        marketAnalysis,
        recommendations,
        
        reportMetadata: {
          generatedAt: new Date(),
          reportVersion: '1.0',
          dataSourcesCount: this.countDataSources(mileageRecords, vehicle),
          confidenceLevel: this.calculateConfidenceLevel(vehicle, mileageRecords),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Valid for 30 days
        }
      };
      
      logger.info(`✅ Vehicle history report generated successfully`);
      
      return report;
      
    } catch (error) {
      logger.error(`❌ Failed to generate vehicle history report:`, error);
      throw new ApiError('Failed to generate vehicle history report', 500);
    }
  }
  
  /**
   * Analyze mileage history patterns
   */
  private static analyzeMileageHistory(records: any[]): any {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        verifiedRecords: 0,
        blockchainRecords: 0,
        averageMonthlyMileage: 0,
        mileagePattern: 'insufficient_data',
        records: []
      };
    }
    
    const verifiedRecords = records.filter(r => r.verified).length;
    const blockchainRecords = records.filter(r => r.blockchainHash).length;
    
    // Calculate average monthly mileage
    const firstRecord = records[records.length - 1];
    const lastRecord = records[0];
    const monthsDiff = (lastRecord.recordedAt.getTime() - firstRecord.recordedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const mileageDiff = lastRecord.mileage - firstRecord.mileage;
    const averageMonthlyMileage = monthsDiff > 0 ? mileageDiff / monthsDiff : 0;
    
    // Analyze pattern
    let mileagePattern = 'consistent';
    const mileageIncreases = [];
    
    for (let i = 1; i < records.length; i++) {
      const increase = records[i-1].mileage - records[i].mileage;
      if (increase < 0) {
        mileagePattern = 'suspicious'; // Rollback detected
        break;
      }
      mileageIncreases.push(increase);
    }
    
    if (mileagePattern !== 'suspicious') {
      const avgIncrease = mileageIncreases.reduce((a, b) => a + b, 0) / mileageIncreases.length;
      const variance = mileageIncreases.reduce((sum, val) => sum + Math.pow(val - avgIncrease, 2), 0) / mileageIncreases.length;
      
      if (variance > avgIncrease * 0.5) {
        mileagePattern = 'irregular';
      }
    }
    
    return {
      totalRecords: records.length,
      verifiedRecords,
      blockchainRecords,
      firstRecorded: firstRecord.recordedAt,
      lastRecorded: lastRecord.recordedAt,
      averageMonthlyMileage: Math.round(averageMonthlyMileage),
      mileagePattern,
      records: records.slice(0, 50).map(r => ({
        date: r.recordedAt,
        mileage: r.mileage,
        source: r.source,
        verified: r.verified,
        blockchainHash: r.blockchainHash,
        location: r.location
      }))
    };
  }
  
  /**
   * Get blockchain verification data
   */
  private static async getBlockchainVerificationData(vin: string): Promise<any> {
    try {
      // This would query the blockchain for all transactions related to this VIN
      // For now, we'll use the mileage records with blockchain hashes
      const blockchainRecords = await MileageHistory.find({
        vin: vin,
        blockchainHash: { $exists: true, $ne: null }
      }).sort({ recordedAt: -1 });
      
      const isOnBlockchain = blockchainRecords.length > 0;
      const totalTransactions = blockchainRecords.length;
      
      let blockchainIntegrity = 'unverified';
      if (totalTransactions > 10) {
        blockchainIntegrity = 'verified';
      } else if (totalTransactions > 0) {
        blockchainIntegrity = 'partial';
      }
      
      return {
        isOnBlockchain,
        totalTransactions,
        firstTransaction: blockchainRecords.length > 0 ? blockchainRecords[blockchainRecords.length - 1].recordedAt : undefined,
        lastTransaction: blockchainRecords.length > 0 ? blockchainRecords[0].recordedAt : undefined,
        blockchainIntegrity,
        transactions: blockchainRecords.slice(0, 20).map(r => ({
          hash: r.blockchainHash,
          date: r.recordedAt,
          type: 'mileage_update',
          mileage: r.mileage,
          verified: true
        }))
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get blockchain verification data:`, error);
      return {
        isOnBlockchain: false,
        totalTransactions: 0,
        blockchainIntegrity: 'unverified',
        transactions: []
      };
    }
  }
  
  /**
   * Analyze fraud alerts
   */
  private static analyzeFraudAlerts(fraudAlerts: any[]): any {
    const activeAlerts = fraudAlerts.filter(alert => alert.status === 'active');
    const resolvedAlerts = fraudAlerts.filter(alert => alert.status === 'resolved');
    const criticalAlerts = fraudAlerts.filter(alert => alert.severity === 'critical');
    
    return {
      totalAlerts: fraudAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      criticalAlerts: criticalAlerts.length,
      alerts: fraudAlerts.map(alert => ({
        type: alert.alertType,
        severity: alert.severity,
        description: alert.description,
        date: alert.reportedAt,
        status: alert.status
      }))
    };
  }
  
  /**
   * Analyze service history
   */
  private static analyzeServiceHistory(serviceHistory: any[]): any {
    const verifiedServices = serviceHistory.filter(service => service.verified);
    const lastService = serviceHistory.length > 0 ? 
      serviceHistory.reduce((latest, current) => 
        current.serviceDate > latest.serviceDate ? current : latest
      ) : null;
    
    // Calculate maintenance score based on service frequency and recency
    let maintenanceScore = 50; // Base score
    
    if (serviceHistory.length > 0) {
      maintenanceScore += Math.min(serviceHistory.length * 5, 30); // Up to 30 points for service count
      
      if (lastService) {
        const monthsSinceLastService = (Date.now() - lastService.serviceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSinceLastService < 6) {
          maintenanceScore += 20; // Recent service
        } else if (monthsSinceLastService > 12) {
          maintenanceScore -= 20; // Overdue service
        }
      }
    }
    
    maintenanceScore = Math.max(0, Math.min(100, maintenanceScore));
    
    return {
      totalServices: serviceHistory.length,
      verifiedServices: verifiedServices.length,
      lastServiceDate: lastService?.serviceDate,
      nextServiceDue: lastService?.nextServiceDue,
      maintenanceScore,
      services: serviceHistory.slice(0, 20).map(service => ({
        date: service.serviceDate,
        type: service.serviceType,
        description: service.description,
        mileage: service.mileageAtService,
        cost: service.cost,
        verified: service.verified
      }))
    };
  }
  
  /**
   * Analyze accident history
   */
  private static analyzeAccidentHistory(accidentHistory: any[]): any {
    const majorAccidents = accidentHistory.filter(accident => 
      accident.severity === 'major' || accident.severity === 'total_loss'
    );
    
    const lastAccident = accidentHistory.length > 0 ?
      accidentHistory.reduce((latest, current) =>
        current.accidentDate > latest.accidentDate ? current : latest
      ) : null;
    
    return {
      totalAccidents: accidentHistory.length,
      majorAccidents: majorAccidents.length,
      lastAccidentDate: lastAccident?.accidentDate,
      accidents: accidentHistory.map(accident => ({
        date: accident.accidentDate,
        severity: accident.severity,
        description: accident.description,
        repairCost: accident.repairCost,
        verified: accident.verified
      }))
    };
  }
  
  /**
   * Get market analysis for the vehicle
   */
  private static async getMarketAnalysisInternal(vehicle: any): Promise<any> {
    try {
      // Find similar vehicles in the marketplace
      const similarVehicles = await Vehicle.find({
        make: vehicle.make,
        vehicleModel: vehicle.vehicleModel,
        year: { $gte: vehicle.year - 2, $lte: vehicle.year + 2 },
        isForSale: true,
        listingStatus: 'active',
        _id: { $ne: vehicle._id }
      });
      
      // Calculate estimated value based on year, mileage, condition, and trust score
      let baseValue = this.getBaseVehicleValue(vehicle.make, vehicle.vehicleModel, vehicle.year);
      
      // Adjust for mileage (assuming 15,000 miles per year is average)
      const expectedMileage = (new Date().getFullYear() - vehicle.year) * 15000;
      const mileageAdjustment = (expectedMileage - vehicle.currentMileage) * 0.1; // $0.10 per mile difference
      baseValue += mileageAdjustment;
      
      // Adjust for condition
      const conditionMultipliers = {
        excellent: 1.1,
        good: 1.0,
        fair: 0.85,
        poor: 0.7
      };
      baseValue *= conditionMultipliers[vehicle.condition] || 1.0;
      
      // Adjust for trust score
      const trustAdjustment = (vehicle.trustScore - 50) * 0.002; // 0.2% per trust point above/below 50
      baseValue *= (1 + trustAdjustment);
      
      // Calculate market comparison
      const averageMarketPrice = similarVehicles.length > 0 ?
        similarVehicles.reduce((sum, v) => sum + (v.askingPrice || baseValue), 0) / similarVehicles.length :
        baseValue;
      
      let marketComparison = 'at_market';
      if (baseValue > averageMarketPrice * 1.1) {
        marketComparison = 'above_market';
      } else if (baseValue < averageMarketPrice * 0.9) {
        marketComparison = 'below_market';
      }
      
      // Determine demand level based on similar vehicles count
      let demandLevel = 'medium';
      if (similarVehicles.length > 10) {
        demandLevel = 'low';
      } else if (similarVehicles.length < 3) {
        demandLevel = 'high';
      }
      
      return {
        estimatedValue: Math.round(baseValue),
        marketComparison,
        demandLevel,
        similarVehicles: similarVehicles.length,
        averageMarketPrice: Math.round(averageMarketPrice),
        priceRange: {
          min: Math.round(baseValue * 0.85),
          max: Math.round(baseValue * 1.15)
        }
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get market analysis:`, error);
      return {
        estimatedValue: 0,
        marketComparison: 'unknown',
        demandLevel: 'unknown',
        similarVehicles: 0,
        averageMarketPrice: 0,
        priceRange: { min: 0, max: 0 }
      };
    }
  }
  
  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    vehicle: any,
    mileageAnalysis: any,
    fraudAnalysis: any,
    serviceAnalysis: any,
    marketAnalysis: any
  ): any {
    const listingRecommendations = [];
    const priceRecommendations = [];
    const maintenanceRecommendations = [];
    const trustImprovements = [];
    
    // Listing recommendations
    if (mileageAnalysis.blockchainRecords > 0) {
      listingRecommendations.push('Highlight blockchain-verified mileage history as a key selling point');
    }
    
    if (vehicle.trustScore > 80) {
      listingRecommendations.push('Emphasize high trust score in listing description');
    }
    
    if (fraudAnalysis.activeAlerts === 0) {
      listingRecommendations.push('Mention clean fraud history with no active alerts');
    }
    
    // Price recommendations
    if (marketAnalysis.marketComparison === 'above_market') {
      priceRecommendations.push('Consider reducing price to be more competitive with market');
    } else if (marketAnalysis.marketComparison === 'below_market') {
      priceRecommendations.push('You may be able to increase asking price based on market analysis');
    }
    
    if (marketAnalysis.demandLevel === 'high') {
      priceRecommendations.push('High demand detected - consider pricing at upper end of range');
    }
    
    // Maintenance recommendations
    if (serviceAnalysis.maintenanceScore < 60) {
      maintenanceRecommendations.push('Consider recent service to improve maintenance score');
    }
    
    if (serviceAnalysis.lastServiceDate && 
        (Date.now() - serviceAnalysis.lastServiceDate.getTime()) > (365 * 24 * 60 * 60 * 1000)) {
      maintenanceRecommendations.push('Vehicle is overdue for service - consider maintenance before listing');
    }
    
    // Trust improvements
    if (vehicle.trustScore < 70) {
      trustImprovements.push('Add more verified service records to improve trust score');
    }
    
    if (mileageAnalysis.verifiedRecords < mileageAnalysis.totalRecords * 0.5) {
      trustImprovements.push('Get more mileage records verified by certified service providers');
    }
    
    if (fraudAnalysis.activeAlerts > 0) {
      trustImprovements.push('Resolve active fraud alerts to improve trust score');
    }
    
    return {
      listingRecommendations,
      priceRecommendations,
      maintenanceRecommendations,
      trustImprovements
    };
  }
  
  /**
   * Get base vehicle value (simplified - would use actual market data in production)
   */
  private static getBaseVehicleValue(make: string, model: string, year: number): number {
    // Simplified base value calculation
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Base values by make (simplified)
    const baseValues: { [key: string]: number } = {
      'Toyota': 25000,
      'Honda': 24000,
      'Ford': 22000,
      'Chevrolet': 21000,
      'Nissan': 20000,
      'Hyundai': 19000,
      'Kia': 18000
    };
    
    let baseValue = baseValues[make] || 20000;
    
    // Depreciation (10% per year for first 5 years, 5% thereafter)
    for (let i = 0; i < age; i++) {
      const depreciationRate = i < 5 ? 0.10 : 0.05;
      baseValue *= (1 - depreciationRate);
    }
    
    return Math.max(baseValue, 1000); // Minimum value
  }
  
  /**
   * Count data sources for confidence calculation
   */
  private static countDataSources(mileageRecords: any[], vehicle: any): number {
    let sources = 0;
    
    if (mileageRecords.length > 0) sources++;
    if (vehicle.serviceHistory.length > 0) sources++;
    if (vehicle.accidentHistory.length > 0) sources++;
    if (vehicle.fraudAlerts.length > 0) sources++;
    if (vehicle.blockchainHash) sources++;
    
    return sources;
  }
  
  /**
   * Calculate confidence level based on data quality
   */
  private static calculateConfidenceLevel(vehicle: any, mileageRecords: any[]): number {
    let confidence = 50; // Base confidence
    
    // Add confidence based on data availability
    if (mileageRecords.length > 10) confidence += 20;
    if (vehicle.serviceHistory.length > 5) confidence += 15;
    if (vehicle.trustScore > 80) confidence += 10;
    if (vehicle.verificationStatus === 'verified') confidence += 5;
    
    // Reduce confidence for issues
    if (vehicle.fraudAlerts.filter((a: any) => a.status === 'active').length > 0) confidence -= 20;
    if (vehicle.trustScore < 50) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get marketplace listings with filters and pagination
   */
  static async getMarketplaceListings(
    filters: any,
    options: { page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }
  ): Promise<any> {
    try {
      const skip = (options.page - 1) * options.limit;
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      
      const [vehicles, total] = await Promise.all([
        Vehicle.find(filters)
          .populate('ownerId', 'firstName lastName email')
          .skip(skip)
          .limit(options.limit)
          .sort({ [options.sortBy]: sortOrder }),
        Vehicle.countDocuments(filters)
      ]);
      
      // Transform to marketplace listings format
      const listings = vehicles.map(vehicle => ({
        id: vehicle._id.toString(),
        vehicle: {
          id: vehicle._id.toString(),
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.vehicleModel,
          year: vehicle.year,
          color: vehicle.color,
          currentMileage: vehicle.currentMileage,
          condition: vehicle.condition,
          trustScore: vehicle.trustScore,
          features: vehicle.features || [],
          owner: vehicle.ownerId,
          createdAt: vehicle.createdAt
        },
        price: vehicle.price || 25000, // Use vehicle price field or default
        negotiable: true,
        description: vehicle.description,
        listedAt: vehicle.createdAt,
        views: 0,
        inquiries: 0
      }));
      
      return {
        listings,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error(`❌ Failed to get marketplace listings:`, error);
      throw new ApiError('Failed to get marketplace listings', 500);
    }
  }
  
  /**
   * Get vehicle marketplace details
   */
  static async getVehicleMarketplaceDetails(
    vehicleId: string,
    includeHistoryReport: boolean = false
  ): Promise<any> {
    try {
      const vehicle = await Vehicle.findById(vehicleId)
        .populate('ownerId', 'firstName lastName email');
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      
      let historyReport = null;
      if (includeHistoryReport) {
        historyReport = await this.generateVehicleHistoryReport(vehicleId);
      }
      
      return {
        vehicle,
        historyReport
      };
    } catch (error) {
      logger.error(`❌ Failed to get vehicle marketplace details:`, error);
      throw error;
    }
  }
  
  /**
   * Update vehicle listing
   */
  static async updateVehicleListing(
    vehicleId: string,
    ownerId: string,
    updateData: any
  ): Promise<any> {
    try {
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        ownerId: ownerId
      });
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or not owned by user');
      }
      
      // Update vehicle listing data
      Object.assign(vehicle, updateData);
      await vehicle.save();
      
      return vehicle;
    } catch (error) {
      logger.error(`❌ Failed to update vehicle listing:`, error);
      throw error;
    }
  }
  
  /**
   * Remove vehicle listing
   */
  static async removeVehicleListing(
    vehicleId: string,
    ownerId: string,
    reason?: string
  ): Promise<any> {
    try {
      const vehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicleId, ownerId: ownerId },
        { 
          isForSale: false,
          listingStatus: 'not_listed',
          listingRemovedAt: new Date(),
          listingRemovalReason: reason
        },
        { new: true }
      );
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or not owned by user');
      }
      
      return vehicle;
    } catch (error) {
      logger.error(`❌ Failed to remove vehicle listing:`, error);
      throw error;
    }
  }
  
  /**
   * Get market analysis for vehicle
   */
  static async getMarketAnalysis(vehicleId: string): Promise<any> {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      
      return await this.getMarketAnalysisInternal(vehicle);
    } catch (error) {
      logger.error(`❌ Failed to get market analysis:`, error);
      throw error;
    }
  }
  
  /**
   * Search marketplace
   */
  static async searchMarketplace(searchParams: any): Promise<any> {
    try {
      const { query, filters, location, radius, page, limit } = searchParams;
      
      const searchQuery: any = {
        isForSale: true,
        listingStatus: 'active'
      };
      
      // Add text search
      if (query) {
        searchQuery.$or = [
          { make: new RegExp(query, 'i') },
          { vehicleModel: new RegExp(query, 'i') },
          { description: new RegExp(query, 'i') }
        ];
      }
      
      // Add filters
      Object.assign(searchQuery, filters);
      
      const skip = (page - 1) * limit;
      
      const [vehicles, total] = await Promise.all([
        Vehicle.find(searchQuery)
          .populate('ownerId', 'firstName lastName')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Vehicle.countDocuments(searchQuery)
      ]);
      
      return {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`❌ Failed to search marketplace:`, error);
      throw new ApiError('Failed to search marketplace', 500);
    }
  }
  
  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStatistics(timeframe: string): Promise<any> {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }
      
      const [totalListings, activeListings, recentListings, averagePrice] = await Promise.all([
        Vehicle.countDocuments({ isForSale: true }),
        Vehicle.countDocuments({ isForSale: true, listingStatus: 'active' }),
        Vehicle.countDocuments({ 
          isForSale: true, 
          createdAt: { $gte: startDate } 
        }),
        Vehicle.aggregate([
          { $match: { isForSale: true, listingStatus: 'active' } },
          { $group: { _id: null, avgPrice: { $avg: '$estimatedValue' } } }
        ])
      ]);
      
      return {
        totalListings,
        activeListings,
        recentListings,
        averagePrice: averagePrice[0]?.avgPrice || 0,
        timeframe
      };
    } catch (error) {
      logger.error(`❌ Failed to get marketplace statistics:`, error);
      throw new ApiError('Failed to get marketplace statistics', 500);
    }
  }
}

export default MarketplaceService;
