import { Request, Response } from 'express';
import { TrustEvent } from '../../models/core/TrustEvent.model';
import Vehicle from '../../models/core/Vehicle.model';
import { emitToUser } from '../../utils/socketEmitter';
import { logger } from '../../utils/logger';

export class TrustController {
  /**
   * Get trust history for a vehicle
   * GET /api/trust/:vehicleId/history
   */
  static async getTrustHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { page = 1, limit = 20, filter = 'all' } = req.query;
      const userId = (req as any).user?.id;

      // Verify user has access to this vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      // Check if user is owner or admin
      if (vehicle.ownerId.toString() !== userId && (req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Build filter query
      let filterQuery: any = { vehicleId };
      if (filter === 'negative') {
        filterQuery.change = { $lt: 0 };
      } else if (filter === 'positive') {
        filterQuery.change = { $gt: 0 };
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [events, total] = await Promise.all([
        TrustEvent.find(filterQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('createdBy', 'firstName lastName')
          .lean(),
        TrustEvent.countDocuments(filterQuery)
      ]);

      res.json({
        success: true,
        data: events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      logger.error('Error fetching trust history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trust history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get specific trust event details
   * GET /api/trust/:vehicleId/event/:eventId
   */
  static async getTrustEvent(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, eventId } = req.params;
      const userId = (req as any).user?.id;

      // Verify user has access to this vehicle
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      if (vehicle.ownerId.toString() !== userId && (req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const event = await TrustEvent.findOne({
        _id: eventId,
        vehicleId
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('details.telemetryId')
      .populate('details.fraudAlertId')
      .lean();

      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Trust event not found'
        });
        return;
      }

      res.json({
        success: true,
        data: event
      });

    } catch (error) {
      logger.error('Error fetching trust event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trust event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manual trust score adjustment (admin only)
   * POST /api/trust/:vehicleId/manual-adjust
   */
  static async manualAdjust(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { change, reason, details } = req.body;
      const userId = (req as any).user?.id;

      // Check if user is admin
      if ((req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      // Validate input
      if (!change || !reason) {
        res.status(400).json({
          success: false,
          message: 'Change and reason are required'
        });
        return;
      }

      // Get vehicle and update trust score
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      const previousScore = vehicle.trustScore;
      const newScore = Math.max(0, Math.min(100, previousScore + change));

      // Create trust event
      const trustEvent = new TrustEvent({
        vehicleId,
        change,
        previousScore,
        newScore,
        reason,
        details: details || {},
        source: 'manual',
        createdBy: userId
      });

      // Update vehicle trust score atomically
      await Promise.all([
        trustEvent.save(),
        Vehicle.findByIdAndUpdate(vehicleId, {
          $set: { trustScore: newScore },
          $inc: { trustHistoryCount: 1 }
        })
      ]);

      // Emit socket event
      emitToUser(vehicle.ownerId.toString(), 'trustscore_changed', {
        vehicleId,
        previousScore,
        newScore,
        eventId: trustEvent._id,
        reason,
        change
      });

      res.json({
        success: true,
        data: {
          eventId: trustEvent._id,
          previousScore,
          newScore,
          change
        }
      });

    } catch (error) {
      logger.error('Error in manual trust adjustment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust trust score',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
