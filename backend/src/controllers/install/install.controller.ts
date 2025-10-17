import { Request, Response } from 'express';
import Install from '../../models/core/Install.model';
import Vehicle from '../../models/core/Vehicle.model';
import { User } from '../../models/core/User.model';
import { Notification } from '../../models/core/Notification.model';
import { logger } from '../../utils/logger';

export class InstallController {
  /**
   * Get install requests for a user
   */
  static async getInstallsByUser(
    userId: string,
    options: {
      status?: string;
      page: number;
      limit: number;
    }
  ) {
    try {
      const { status, page, limit } = options;
      const skip = (page - 1) * limit;

      const query: any = { ownerId: userId };
      if (status) query.status = status;

      const [installs, total] = await Promise.all([
        Install.find(query)
          .populate('vehicleId', 'vin make vehicleModel year color')
          .populate('serviceProviderId', 'firstName lastName email phone')
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit),
        Install.countDocuments(query)
      ]);

      return {
        installs: installs.map(install => ({
          id: install._id,
          vehicleId: install.vehicleId,
          serviceProviderId: install.serviceProviderId,
          deviceId: install.deviceId,
          status: install.status,
          requestedAt: install.requestedAt,
          assignedAt: install.assignedAt,
          startedAt: install.startedAt,
          completedAt: install.completedAt,
          cancelledAt: install.cancelledAt,
          cancellationReason: install.cancellationReason,
          notes: install.notes,
          location: install.location,
          estimatedDuration: install.estimatedDuration,
          actualDuration: install.actualDuration,
          cost: install.cost,
          paymentStatus: install.paymentStatus,
          feedback: install.feedback,
          statusHistory: install.getStatusHistory()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get installs by user:', error);
      throw error;
    }
  }

  /**
   * Create a new install request
   */
  static async createInstallRequest(
    userId: string,
    data: {
      vehicleId: string;
      location: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
      notes?: string;
      estimatedDuration?: number;
    }
  ) {
    try {
      // Verify vehicle exists and belongs to user
      const vehicle = await Vehicle.findOne({
        _id: data.vehicleId,
        ownerId: userId
      });

      if (!vehicle) {
        throw new Error('Vehicle not found or access denied');
      }

      // Check if there's already a pending install for this vehicle
      const existingInstall = await Install.findOne({
        vehicleId: data.vehicleId,
        status: { $in: ['pending', 'assigned', 'in_progress'] }
      });

      if (existingInstall) {
        throw new Error('There is already a pending install request for this vehicle');
      }

      // Create new install request
      const install = new Install({
        vehicleId: data.vehicleId,
        ownerId: userId,
        status: 'pending',
        location: data.location,
        notes: data.notes,
        estimatedDuration: data.estimatedDuration,
        statusHistory: [{
          status: 'pending',
          changedBy: userId,
          changedAt: new Date(),
          reason: 'Install request created'
        }]
      });

      await install.save();

      // Create notifications
      try {
        // Owner notification
        await Notification.create({
          userId,
          userRole: 'owner',
          title: 'Install Request Submitted',
          message: `Your device installation request for ${vehicle.vin} has been submitted and is awaiting assignment.`,
          type: 'install_request',
          priority: 'medium',
          channels: ['in_app'],
          actionUrl: `/installs/${install._id}`,
          actionLabel: 'View request'
        });

        // Admin notifications
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length) {
          await Notification.insertMany(admins.map(admin => ({
            userId: admin._id.toString(),
            userRole: 'admin',
            title: 'New Install Request',
            message: `New device installation request for vehicle ${vehicle.vin} requires assignment.`,
            type: 'install_request',
            priority: 'high',
            channels: ['in_app'],
            actionUrl: `/admin/installs`,
            actionLabel: 'Assign now'
          })));
        }
      } catch (notifyErr) {
        logger.warn('Failed to create install notifications:', notifyErr);
      }

      // Populate the response
      const populatedInstall = await Install.findById(install._id)
        .populate('vehicleId', 'vin make vehicleModel year color')
        .populate('ownerId', 'firstName lastName email');

      return {
        id: populatedInstall._id,
        vehicleId: populatedInstall.vehicleId,
        ownerId: populatedInstall.ownerId,
        status: populatedInstall.status,
        requestedAt: populatedInstall.requestedAt,
        location: populatedInstall.location,
        notes: populatedInstall.notes,
        estimatedDuration: populatedInstall.estimatedDuration,
        statusHistory: populatedInstall.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to create install request:', error);
      throw error;
    }
  }

  /**
   * Get install details
   */
  static async getInstallDetails(installId: string, userId: string) {
    try {
      const install = await Install.findOne({
        _id: installId,
        $or: [
          { ownerId: userId },
          { serviceProviderId: userId }
        ]
      })
        .populate('vehicleId', 'vin make vehicleModel year color currentMileage trustScore')
        .populate('ownerId', 'firstName lastName email phone')
        .populate('serviceProviderId', 'firstName lastName email phone');

      if (!install) {
        throw new Error('Install request not found or access denied');
      }

      return {
        id: install._id,
        vehicleId: install.vehicleId,
        ownerId: install.ownerId,
        serviceProviderId: install.serviceProviderId,
        deviceId: install.deviceId,
        status: install.status,
        requestedAt: install.requestedAt,
        assignedAt: install.assignedAt,
        startedAt: install.startedAt,
        completedAt: install.completedAt,
        cancelledAt: install.cancelledAt,
        cancellationReason: install.cancellationReason,
        notes: install.notes,
        location: install.location,
        estimatedDuration: install.estimatedDuration,
        actualDuration: install.actualDuration,
        cost: install.cost,
        paymentStatus: install.paymentStatus,
        feedback: install.feedback,
        statusHistory: install.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to get install details:', error);
      throw error;
    }
  }

  /**
   * Assign install to service provider (Admin only)
   */
  static async assignToServiceProvider(
    installId: string,
    data: {
      serviceProviderId: string;
      notes?: string;
      assignedBy: string;
    }
  ) {
    try {
      const install = await Install.findById(installId);
      if (!install) {
        throw new Error('Install request not found');
      }

      if (install.status !== 'pending') {
        throw new Error('Can only assign pending install requests');
      }

      // Verify service provider exists
      const serviceProvider = await User.findOne({
        _id: data.serviceProviderId,
        role: 'service'
      });

      if (!serviceProvider) {
        throw new Error('Service provider not found');
      }

      await install.assignToServiceProvider(data.serviceProviderId, data.notes);

      // Create notifications
      try {
        // Service provider notification
        await Notification.create({
          userId: data.serviceProviderId,
          userRole: 'service',
          title: 'New Install Assignment',
          message: `You have been assigned a new device installation request.`,
          type: 'install_assignment',
          priority: 'high',
          channels: ['in_app', 'email'],
          actionUrl: `/sp/installs/${installId}`,
          actionLabel: 'View assignment'
        });

        // Owner notification
        await Notification.create({
          userId: install.ownerId.toString(),
          userRole: 'owner',
          title: 'Install Request Assigned',
          message: `Your device installation request has been assigned to a service provider.`,
          type: 'install_assignment',
          priority: 'medium',
          channels: ['in_app'],
          actionUrl: `/installs/${installId}`,
          actionLabel: 'View status'
        });
      } catch (notifyErr) {
        logger.warn('Failed to create assignment notifications:', notifyErr);
      }

      // Populate the response
      const populatedInstall = await Install.findById(installId)
        .populate('vehicleId', 'vin make vehicleModel year color')
        .populate('ownerId', 'firstName lastName email')
        .populate('serviceProviderId', 'firstName lastName email phone');

      return {
        id: populatedInstall._id,
        vehicleId: populatedInstall.vehicleId,
        ownerId: populatedInstall.ownerId,
        serviceProviderId: populatedInstall.serviceProviderId,
        status: populatedInstall.status,
        assignedAt: populatedInstall.assignedAt,
        notes: populatedInstall.notes,
        statusHistory: populatedInstall.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to assign install to service provider:', error);
      throw error;
    }
  }

  /**
   * Start installation (Service Provider only)
   */
  static async startInstallation(
    installId: string,
    data: {
      deviceId: string;
      notes?: string;
      startedBy: string;
    }
  ) {
    try {
      const install = await Install.findOne({
        _id: installId,
        serviceProviderId: data.startedBy
      });

      if (!install) {
        throw new Error('Install request not found or access denied');
      }

      await install.startInstallation(data.deviceId, data.notes);

      // Create notifications
      try {
        // Owner notification
        await Notification.create({
          userId: install.ownerId.toString(),
          userRole: 'owner',
          title: 'Installation Started',
          message: `Device installation has started for your vehicle.`,
          type: 'install_progress',
          priority: 'medium',
          channels: ['in_app'],
          actionUrl: `/installs/${installId}`,
          actionLabel: 'View progress'
        });
      } catch (notifyErr) {
        logger.warn('Failed to create start notifications:', notifyErr);
      }

      return {
        id: install._id,
        deviceId: install.deviceId,
        status: install.status,
        startedAt: install.startedAt,
        notes: install.notes,
        statusHistory: install.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to start installation:', error);
      throw error;
    }
  }

  /**
   * Complete installation (Service Provider only)
   */
  static async completeInstallation(
    installId: string,
    data: {
      notes?: string;
      feedback?: any;
      completedBy: string;
    }
  ) {
    try {
      const install = await Install.findOne({
        _id: installId,
        serviceProviderId: data.completedBy
      });

      if (!install) {
        throw new Error('Install request not found or access denied');
      }

      await install.completeInstallation(data.notes, data.feedback);

      // Update vehicle to mark device as installed
      await Vehicle.findByIdAndUpdate(install.vehicleId, {
        $set: {
          hasDevice: true,
          deviceId: install.deviceId,
          deviceStatus: 'active'
        }
      });

      // Create notifications
      try {
        // Owner notification
        await Notification.create({
          userId: install.ownerId.toString(),
          userRole: 'owner',
          title: 'Installation Completed',
          message: `Device installation has been completed for your vehicle.`,
          type: 'install_complete',
          priority: 'high',
          channels: ['in_app', 'email'],
          actionUrl: `/vehicles/${install.vehicleId}`,
          actionLabel: 'View vehicle'
        });
      } catch (notifyErr) {
        logger.warn('Failed to create completion notifications:', notifyErr);
      }

      return {
        id: install._id,
        status: install.status,
        completedAt: install.completedAt,
        actualDuration: install.actualDuration,
        notes: install.notes,
        feedback: install.feedback,
        statusHistory: install.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to complete installation:', error);
      throw error;
    }
  }

  /**
   * Cancel installation
   */
  static async cancelInstallation(
    installId: string,
    data: {
      reason: string;
      cancelledBy: string;
    }
  ) {
    try {
      const install = await Install.findOne({
        _id: installId,
        $or: [
          { ownerId: data.cancelledBy },
          { serviceProviderId: data.cancelledBy }
        ]
      });

      if (!install) {
        throw new Error('Install request not found or access denied');
      }

      await install.cancelInstallation(data.reason);

      return {
        id: install._id,
        status: install.status,
        cancelledAt: install.cancelledAt,
        cancellationReason: install.cancellationReason,
        statusHistory: install.getStatusHistory()
      };
    } catch (error) {
      logger.error('Failed to cancel installation:', error);
      throw error;
    }
  }

  /**
   * Get pending install requests (Admin only)
   */
  static async getPendingInstalls(options: {
    page: number;
    limit: number;
  }) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const [installs, total] = await Promise.all([
        Install.find({ status: 'pending' })
          .populate('vehicleId', 'vin make vehicleModel year color')
          .populate('ownerId', 'firstName lastName email phone')
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit),
        Install.countDocuments({ status: 'pending' })
      ]);

      return {
        installs: installs.map(install => ({
          id: install._id,
          vehicleId: install.vehicleId,
          ownerId: install.ownerId,
          status: install.status,
          requestedAt: install.requestedAt,
          location: install.location,
          notes: install.notes,
          estimatedDuration: install.estimatedDuration,
          statusHistory: install.getStatusHistory()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get pending installs:', error);
      throw error;
    }
  }

  /**
   * Get installs by service provider
   */
  static async getInstallsByServiceProvider(
    serviceProviderId: string,
    options: {
      status?: string;
      page: number;
      limit: number;
    }
  ) {
    try {
      const { status, page, limit } = options;
      const skip = (page - 1) * limit;

      const query: any = { serviceProviderId };
      if (status) query.status = status;

      const [installs, total] = await Promise.all([
        Install.find(query)
          .populate('vehicleId', 'vin make vehicleModel year color')
          .populate('ownerId', 'firstName lastName email phone')
          .sort({ requestedAt: -1 })
          .skip(skip)
          .limit(limit),
        Install.countDocuments(query)
      ]);

      return {
        installs: installs.map(install => ({
          id: install._id,
          vehicleId: install.vehicleId,
          ownerId: install.ownerId,
          deviceId: install.deviceId,
          status: install.status,
          requestedAt: install.requestedAt,
          assignedAt: install.assignedAt,
          startedAt: install.startedAt,
          completedAt: install.completedAt,
          location: install.location,
          notes: install.notes,
          estimatedDuration: install.estimatedDuration,
          actualDuration: install.actualDuration,
          cost: install.cost,
          feedback: install.feedback,
          statusHistory: install.getStatusHistory()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get installs by service provider:', error);
      throw error;
    }
  }
}



