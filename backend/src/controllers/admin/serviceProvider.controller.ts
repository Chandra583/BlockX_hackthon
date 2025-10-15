import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiError, ValidationError, NotFoundError } from '../../utils/errors';
import ServiceProviderService from '../../services/core/serviceProvider.service';
import { AuthenticatedRequest } from '../../types/auth.types';

export class ServiceProviderController {
  
  /**
   * Register a new service provider
   * POST /api/admin/service-providers/register
   */
  static async registerServiceProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new ValidationError('Admin authentication required');
      }
      
      const serviceProvider = await ServiceProviderService.registerServiceProvider(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Service provider registered successfully',
        data: { serviceProvider }
      });
      
    } catch (error) {
      logger.error('❌ Failed to register service provider:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to register service provider'
      });
    }
  }
  
  /**
   * Get all service providers
   * GET /api/admin/service-providers
   */
  static async getServiceProviders(req: Request, res: Response): Promise<void> {
    try {
      const { status, city, state, deviceType, page = 1, limit = 20 } = req.query;
      
      const query: any = {};
      if (status) query.verificationStatus = status;
      if (city) query['serviceAreas.city'] = new RegExp(city as string, 'i');
      if (state) query['serviceAreas.state'] = new RegExp(state as string, 'i');
      if (deviceType) query['capabilities.deviceType'] = deviceType;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [serviceProviders, total] = await Promise.all([
        ServiceProviderService.findServiceProviders(query, { skip, limit: Number(limit) }),
        ServiceProviderService.countServiceProviders(query)
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          serviceProviders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
      
    } catch (error) {
      logger.error('❌ Failed to get service providers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service providers'
      });
    }
  }
  
  /**
   * Request device installation
   * POST /api/admin/device-installation/request
   */
  static async requestDeviceInstallation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new ValidationError('Admin authentication required');
      }
      
      const installationRequest = {
        ...req.body,
        requestedBy: adminId
      };
      
      const result = await ServiceProviderService.requestDeviceInstallation(installationRequest);
      
      res.status(201).json({
        success: true,
        message: 'Device installation request created successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to request device installation:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to create installation request'
      });
    }
  }
  
  /**
   * Assign installation to service provider
   * POST /api/admin/device-installation/assign
   */
  static async assignInstallation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new ValidationError('Admin authentication required');
      }
      
      const assignment = {
        ...req.body,
        assignedBy: adminId
      };
      
      const result = await ServiceProviderService.assignInstallation(assignment);
      
      res.status(200).json({
        success: true,
        message: 'Installation assigned successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to assign installation:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to assign installation'
      });
    }
  }
  
  /**
   * Get admin dashboard for service provider management
   * GET /api/admin/service-providers/dashboard
   */
  static async getAdminDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dashboard = await ServiceProviderService.getAdminDashboard();
      
      res.status(200).json({
        success: true,
        data: dashboard
      });
      
    } catch (error) {
      logger.error('❌ Failed to get admin dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin dashboard'
      });
    }
  }
  
  /**
   * Update installation status
   * PUT /api/admin/device-installation/:deviceId/status
   */
  static async updateInstallationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { status, serviceProviderId, notes, photos } = req.body;
      
      const result = await ServiceProviderService.updateInstallationStatus(
        deviceId,
        status,
        serviceProviderId,
        notes,
        photos
      );
      
      res.status(200).json({
        success: true,
        message: 'Installation status updated successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to update installation status:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to update installation status'
      });
    }
  }
  
  /**
   * Verify service provider
   * PUT /api/admin/service-providers/:providerId/verify
   */
  static async verifyServiceProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { verificationStatus, notes } = req.body;
      
      const result = await ServiceProviderService.updateVerificationStatus(
        providerId,
        verificationStatus,
        notes
      );
      
      res.status(200).json({
        success: true,
        message: 'Service provider verification updated successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to verify service provider:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        message: error.message || 'Failed to update verification status'
      });
    }
  }
  
  /**
   * Get pending installation requests
   * GET /api/admin/device-installation/pending
   */
  static async getPendingInstallations(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, priority, city, state } = req.query;
      
      const filters: any = {};
      if (priority) filters.priority = priority;
      if (city) filters.city = city;
      if (state) filters.state = state;
      
      const result = await ServiceProviderService.getPendingInstallations(
        filters,
        Number(page),
        Number(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('❌ Failed to get pending installations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending installations'
      });
    }
  }
}

export default ServiceProviderController;
