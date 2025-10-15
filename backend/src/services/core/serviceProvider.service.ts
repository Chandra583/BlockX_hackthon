import { logger } from '../../utils/logger';
import { ApiError, ValidationError, NotFoundError } from '../../utils/errors';
import ServiceProvider from '../../models/core/ServiceProvider.model';
import { Device, User } from '../../models';
import mongoose from 'mongoose';

export interface ServiceProviderRegistrationData {
  userId: string;
  companyName: string;
  licenseNumber: string;
  certifications?: string[];
  serviceAreas: Array<{
    city: string;
    state: string;
    zipCodes?: string[];
    radius?: number;
  }>;
  capabilities: Array<{
    deviceType: string;
    installationType: 'basic' | 'advanced' | 'expert';
    estimatedTime: number;
    cost: number;
  }>;
  contactInfo: {
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  paymentInfo: {
    ratePerHour: number;
    minimumCharge: number;
    paymentMethod?: 'bank_transfer' | 'check' | 'digital_wallet';
  };
}

export interface DeviceInstallationRequest {
  deviceId: string;
  vehicleId: string;
  requestedBy: string;
  scheduledDate?: Date;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preferredServiceProvider?: string;
  location: {
    city: string;
    state: string;
    zipCode?: string;
  };
}

export interface InstallationAssignment {
  deviceId: string;
  serviceProviderId: string;
  scheduledDate: Date;
  estimatedCost: number;
  estimatedTime: number;
  assignedBy: string;
  notes?: string;
}

export class ServiceProviderService {
  
  /**
   * Register a new service provider
   */
  static async registerServiceProvider(data: ServiceProviderRegistrationData): Promise<any> {
    try {
      logger.info(`🔧 Registering service provider: ${data.companyName}`);
      
      // Validate user exists and has appropriate role
      const user = await User.findById(data.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Check if service provider already exists
      const existingProvider = await ServiceProvider.findOne({ userId: data.userId });
      if (existingProvider) {
        throw new ValidationError('Service provider already registered for this user');
      }
      
      // Validate license number uniqueness
      const existingLicense = await ServiceProvider.findOne({ licenseNumber: data.licenseNumber });
      if (existingLicense) {
        throw new ValidationError('License number already registered');
      }
      
      // Create service provider
      const serviceProvider = new ServiceProvider({
        userId: data.userId,
        companyName: data.companyName,
        licenseNumber: data.licenseNumber,
        certifications: data.certifications || [],
        serviceAreas: data.serviceAreas,
        capabilities: data.capabilities,
        contactInfo: data.contactInfo,
        paymentInfo: {
          ...data.paymentInfo,
          paymentMethod: data.paymentInfo.paymentMethod || 'bank_transfer'
        },
        verificationStatus: 'pending',
        isActive: true,
        metrics: {
          totalInstallations: 0,
          successfulInstallations: 0,
          averageRating: 0,
          totalRatings: 0,
          averageInstallationTime: 0,
          onTimePercentage: 100,
          customerSatisfactionScore: 0
        },
        currentAssignments: []
      });
      
      await serviceProvider.save();
      
      logger.info(`✅ Service provider registered: ${serviceProvider._id}`);
      
      return serviceProvider;
      
    } catch (error) {
      logger.error(`❌ Failed to register service provider:`, error);
      throw error;
    }
  }
  
  /**
   * Request device installation
   */
  static async requestDeviceInstallation(request: DeviceInstallationRequest): Promise<any> {
    try {
      logger.info(`📱 Processing device installation request for device: ${request.deviceId}`);
      
      // Validate device exists
      const device = await Device.findById(request.deviceId);
      if (!device) {
        throw new NotFoundError('Device not found');
      }
      
      // Check if device is already assigned or installed
      if (device.installationStatus === 'assigned' || device.installationStatus === 'completed') {
        throw new ValidationError('Device is already assigned or installed');
      }
      
      // Update device with installation request
      device.installationRequest = {
        requestedBy: new mongoose.Types.ObjectId(request.requestedBy),
        requestedAt: new Date(),
        scheduledDate: request.scheduledDate,
        notes: request.notes,
        priority: request.priority
      };
      
      device.installationStatus = 'pending';
      device.status = 'pending_installation';
      
      await device.save();
      
      // Find suitable service providers
      const suitableProviders = await this.findSuitableServiceProviders(
        request.location,
        device.deviceType,
        request.scheduledDate
      );
      
      logger.info(`✅ Installation request created. Found ${suitableProviders.length} suitable providers`);
      
      return {
        device,
        suitableProviders,
        requestId: device._id
      };
      
    } catch (error) {
      logger.error(`❌ Failed to process installation request:`, error);
      throw error;
    }
  }
  
  /**
   * Find suitable service providers for installation
   */
  static async findSuitableServiceProviders(
    location: { city: string; state: string; zipCode?: string },
    deviceType: string,
    scheduledDate?: Date
  ): Promise<any[]> {
    try {
      let providers: any[];
      
      // First, try to find providers by area and capability
      providers = await ServiceProvider.find({
        verificationStatus: 'verified',
        isActive: true,
        'capabilities.deviceType': deviceType,
        'serviceAreas.city': new RegExp(location.city, 'i'),
        'serviceAreas.state': new RegExp(location.state, 'i')
      }).populate('userId', 'firstName lastName email');
      
      // If no providers found in exact area, expand search radius
      if (providers.length === 0) {
        providers = await ServiceProvider.find({
          verificationStatus: 'verified',
          isActive: true,
          'capabilities.deviceType': deviceType,
          'serviceAreas.state': new RegExp(location.state, 'i')
        }).populate('userId', 'firstName lastName email');
      }
      
      // Filter by availability if date is specified
      if (scheduledDate) {
        providers = providers.filter(provider => 
          provider.isAvailableOn(scheduledDate)
        );
      }
      
      // Sort by rating and current workload
      providers.sort((a, b) => {
        const ratingDiff = b.metrics.averageRating - a.metrics.averageRating;
        if (ratingDiff !== 0) return ratingDiff;
        
        // If ratings are equal, prefer less busy providers
        return a.currentAssignments.length - b.currentAssignments.length;
      });
      
      // Add estimated cost and time for each provider
      providers = providers.map(provider => ({
        ...provider.toObject(),
        estimatedCost: provider.getEstimatedCost(deviceType),
        estimatedTime: provider.getEstimatedTime(deviceType),
        currentWorkload: provider.currentAssignments.length
      }));
      
      return providers;
      
    } catch (error) {
      logger.error(`❌ Failed to find suitable service providers:`, error);
      throw new ApiError('Failed to find service providers', 500);
    }
  }
  
  /**
   * Assign device installation to service provider
   */
  static async assignInstallation(assignment: InstallationAssignment): Promise<any> {
    try {
      logger.info(`🔧 Assigning installation: Device ${assignment.deviceId} to Provider ${assignment.serviceProviderId}`);
      
      // Validate device and service provider
      const [device, serviceProvider] = await Promise.all([
        Device.findById(assignment.deviceId),
        ServiceProvider.findById(assignment.serviceProviderId)
      ]);
      
      if (!device) {
        throw new NotFoundError('Device not found');
      }
      
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }
      
      // Check if service provider can handle this device type
      if (!serviceProvider.canInstallDevice(device.deviceType)) {
        throw new ValidationError('Service provider cannot install this device type');
      }
      
      // Check availability
      if (!serviceProvider.isAvailableOn(assignment.scheduledDate)) {
        throw new ValidationError('Service provider is not available on the scheduled date');
      }
      
      // Update device assignment
      device.assignedServiceProvider = new mongoose.Types.ObjectId(assignment.serviceProviderId);
      device.installationStatus = 'assigned';
      device.installationHistory = device.installationHistory || [];
      device.installationHistory.push({
        serviceProvider: new mongoose.Types.ObjectId(assignment.serviceProviderId),
        status: 'assigned',
        timestamp: new Date(),
        notes: assignment.notes
      });
      
      await device.save();
      
      // Update service provider assignments
      serviceProvider.currentAssignments.push({
        deviceId: new mongoose.Types.ObjectId(assignment.deviceId),
        vehicleId: device.vehicle,
        scheduledDate: assignment.scheduledDate,
        status: 'assigned',
        priority: device.installationRequest?.priority || 'medium'
      });
      
      await serviceProvider.save();
      
      logger.info(`✅ Installation assigned successfully`);
      
      return {
        device,
        serviceProvider,
        assignment: {
          scheduledDate: assignment.scheduledDate,
          estimatedCost: assignment.estimatedCost,
          estimatedTime: assignment.estimatedTime
        }
      };
      
    } catch (error) {
      logger.error(`❌ Failed to assign installation:`, error);
      throw error;
    }
  }
  
  /**
   * Update installation status
   */
  static async updateInstallationStatus(
    deviceId: string,
    status: 'in_progress' | 'completed' | 'cancelled',
    serviceProviderId: string,
    notes?: string,
    photos?: string[]
  ): Promise<any> {
    try {
      logger.info(`📱 Updating installation status: ${deviceId} -> ${status}`);
      
      const [device, serviceProvider] = await Promise.all([
        Device.findById(deviceId),
        ServiceProvider.findById(serviceProviderId)
      ]);
      
      if (!device || !serviceProvider) {
        throw new NotFoundError('Device or service provider not found');
      }
      
      // Update device status
      device.installationStatus = status;
      if (status === 'completed') {
        device.status = 'installed';
      } else if (status === 'cancelled') {
        device.status = 'pending_installation';
        device.assignedServiceProvider = undefined;
      }
      
      // Add to installation history
      device.installationHistory = device.installationHistory || [];
      device.installationHistory.push({
        serviceProvider: new mongoose.Types.ObjectId(serviceProviderId),
        status,
        timestamp: new Date(),
        notes,
        photos
      });
      
      await device.save();
      
      // Update service provider assignments
      if (status === 'completed' || status === 'cancelled') {
        serviceProvider.currentAssignments = serviceProvider.currentAssignments.filter(
          assignment => assignment.deviceId.toString() !== deviceId
        );
        
        // Update metrics if completed
        if (status === 'completed') {
          serviceProvider.updateMetrics({
            successful: true,
            onTime: true, // This could be calculated based on scheduled vs actual time
            actualTime: 60 // This should be calculated from actual installation time
          });
        }
        
        await serviceProvider.save();
      }
      
      logger.info(`✅ Installation status updated: ${status}`);
      
      return { device, serviceProvider };
      
    } catch (error) {
      logger.error(`❌ Failed to update installation status:`, error);
      throw error;
    }
  }
  
  /**
   * Get service provider dashboard data
   */
  static async getServiceProviderDashboard(serviceProviderId: string): Promise<any> {
    try {
      const serviceProvider = await ServiceProvider.findById(serviceProviderId)
        .populate('currentAssignments.deviceId')
        .populate('currentAssignments.vehicleId');
      
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }
      
      // Get recent installations
      const recentInstallations = await Device.find({
        'installationHistory.serviceProvider': serviceProviderId
      })
      .sort({ 'installationHistory.timestamp': -1 })
      .limit(10)
      .populate('vehicle', 'vin make vehicleModel year');
      
      // Calculate earnings (this would be more complex in a real system)
      const totalEarnings = serviceProvider.metrics.successfulInstallations * 
        serviceProvider.paymentInfo.ratePerHour * 2; // Assuming 2 hours average
      
      return {
        serviceProvider,
        currentAssignments: serviceProvider.currentAssignments,
        recentInstallations,
        metrics: serviceProvider.metrics,
        earnings: {
          total: totalEarnings,
          thisMonth: totalEarnings * 0.3, // Placeholder calculation
          pending: totalEarnings * 0.1
        }
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get service provider dashboard:`, error);
      throw error;
    }
  }
  
  /**
   * Get admin dashboard for service provider management
   */
  static async getAdminDashboard(): Promise<any> {
    try {
      // Get service provider statistics
      const stats = await ServiceProvider.aggregate([
        {
          $group: {
            _id: null,
            totalProviders: { $sum: 1 },
            verifiedProviders: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
            },
            pendingProviders: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] }
            },
            activeProviders: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            totalInstallations: { $sum: '$metrics.totalInstallations' },
            averageRating: { $avg: '$metrics.averageRating' }
          }
        }
      ]);
      
      // Get pending installation requests
      const pendingInstallations = await Device.find({
        installationStatus: 'pending'
      })
      .populate('installationRequest.requestedBy', 'firstName lastName email')
      .populate('vehicle', 'vin make vehicleModel year')
      .sort({ 'installationRequest.requestedAt': -1 })
      .limit(20);
      
      // Get active assignments
      const activeAssignments = await Device.find({
        installationStatus: { $in: ['assigned', 'in_progress'] }
      })
      .populate('assignedServiceProvider')
      .populate('vehicle', 'vin make vehicleModel year')
      .sort({ 'installationRequest.scheduledDate': 1 });
      
      return {
        statistics: stats[0] || {
          totalProviders: 0,
          verifiedProviders: 0,
          pendingProviders: 0,
          activeProviders: 0,
          totalInstallations: 0,
          averageRating: 0
        },
        pendingInstallations,
        activeAssignments
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get admin dashboard:`, error);
      throw new ApiError('Failed to retrieve admin dashboard data', 500);
    }
  }

  /**
   * Find service providers with query and pagination
   */
  static async findServiceProviders(query: any, options: { skip: number; limit: number }): Promise<any[]> {
    try {
      return await ServiceProvider.find(query)
        .populate('userId', 'firstName lastName email')
        .skip(options.skip)
        .limit(options.limit)
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`❌ Failed to find service providers:`, error);
      throw new ApiError('Failed to find service providers', 500);
    }
  }
  
  /**
   * Count service providers with query
   */
  static async countServiceProviders(query: any): Promise<number> {
    try {
      return await ServiceProvider.countDocuments(query);
    } catch (error) {
      logger.error(`❌ Failed to count service providers:`, error);
      throw new ApiError('Failed to count service providers', 500);
    }
  }
  
  /**
   * Update verification status
   */
  static async updateVerificationStatus(
    providerId: string,
    status: string,
    notes?: string
  ): Promise<any> {
    try {
      const serviceProvider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        { 
          verificationStatus: status,
          verificationNotes: notes,
          verifiedAt: status === 'verified' ? new Date() : undefined
        },
        { new: true }
      );
      
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }
      
      return serviceProvider;
    } catch (error) {
      logger.error(`❌ Failed to update verification status:`, error);
      throw error;
    }
  }
  
  /**
   * Get pending installations with filters
   */
  static async getPendingInstallations(
    filters: any,
    page: number,
    limit: number
  ): Promise<any> {
    try {
      const query: any = { installationStatus: 'pending' };
      
      if (filters.priority) query['installationRequest.priority'] = filters.priority;
      if (filters.city) query['installationRequest.city'] = filters.city;
      if (filters.state) query['installationRequest.state'] = filters.state;
      
      const skip = (page - 1) * limit;
      
      const [installations, total] = await Promise.all([
        Device.find(query)
          .populate('installationRequest.requestedBy', 'firstName lastName email')
          .populate('vehicle', 'vin make vehicleModel year')
          .skip(skip)
          .limit(limit)
          .sort({ 'installationRequest.requestedAt': -1 }),
        Device.countDocuments(query)
      ]);
      
      return {
        pendingInstallations: installations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`❌ Failed to get pending installations:`, error);
      throw new ApiError('Failed to get pending installations', 500);
    }
  }
}

export default ServiceProviderService;
