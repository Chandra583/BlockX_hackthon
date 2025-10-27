import { Request, Response } from 'express';
import { TrustEvent } from '../../models/core/TrustEvent.model';
import Vehicle from '../../models/core/Vehicle.model';
import { TrustScoreService } from '../../services/core/trustScore.service';
import { emitToUser } from '../../utils/socketEmitter';
import { logger } from '../../utils/logger';

export class TrustController {
  /**
   * Get user trust score
   * GET /api/trust/user-score/:userId
   */
  static async getUserTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user?.id;

      // Check if user is accessing their own data or is admin
      if (userId !== currentUserId && (req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Get all vehicles owned by this user
      const vehicles = await Vehicle.find({ ownerId: userId });
      
      if (vehicles.length === 0) {
        res.json({
          success: true,
          data: {
            trustScore: 100,
            averageScore: 100,
            totalVehicles: 0,
            positiveEvents: 0,
            negativeEvents: 0,
            history: []
          }
        });
        return;
      }

      // Calculate average trust score
      const totalScore = vehicles.reduce((sum, vehicle) => sum + (vehicle.trustScore || 100), 0);
      const averageScore = Math.round(totalScore / vehicles.length);

      // Get recent trust events for all vehicles
      const vehicleIds = vehicles.map(v => v._id);
      const recentEvents = await TrustEvent.find({ vehicleId: { $in: vehicleIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('vehicleId', 'vin make model year');

      // Count positive and negative events
      const allEvents = await TrustEvent.find({ vehicleId: { $in: vehicleIds } });
      const positiveEvents = allEvents.filter(event => event.change > 0).length;
      const negativeEvents = allEvents.filter(event => event.change < 0).length;

      res.json({
        success: true,
        data: {
          trustScore: averageScore,
          averageScore,
          totalVehicles: vehicles.length,
          positiveEvents,
          negativeEvents,
          history: recentEvents
        }
      });

    } catch (error) {
      logger.error('Error fetching user trust score:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user trust score'
      });
    }
  }

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
   * Get vehicle trust score
   * GET /api/trust/:vehicleId/score
   */
  static async getVehicleTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const currentUserId = (req as any).user?.id;

      // Get vehicle to check ownership
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
        return;
      }

      // Check if user owns vehicle or is admin
      if (vehicle.ownerId.toString() !== currentUserId && (req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const trustScore = await TrustScoreService.getCurrentTrustScore(vehicleId);

      res.json({
        success: true,
        data: {
          vehicleId,
          trustScore: trustScore.currentScore,
          lastUpdated: trustScore.lastUpdated,
          previousScore: trustScore.previousScore
        }
      });

    } catch (error) {
      logger.error('Error fetching vehicle trust score:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trust score'
      });
    }
  }

  /**
   * Seed initial trust score (for testing)
   * POST /api/trust/:vehicleId/seed
   */
  static async seedTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { score } = req.body;
      const userId = (req as any).user?.id;

      // Check if user is admin
      if ((req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      if (!score || score < 0 || score > 100) {
        res.status(400).json({
          success: false,
          message: 'Valid score (0-100) is required'
        });
        return;
      }

      const trustResult = await TrustScoreService.seedTrustScore(vehicleId, score);

      if (!trustResult.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to seed trust score',
          error: trustResult.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Trust score seeded successfully',
        data: {
          vehicleId,
          previousScore: trustResult.previousScore,
          newScore: trustResult.newScore,
          eventId: trustResult.eventId
        }
      });

    } catch (error) {
      logger.error('Error seeding trust score:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed trust score'
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

      // Use atomic TrustScore service
      const trustResult = await TrustScoreService.updateTrustScore({
        vehicleId,
        change,
        reason,
        source: 'manual',
        details: details || {},
        createdBy: userId
      });

      if (!trustResult.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to update trust score',
          error: trustResult.error
        });
        return;
      }

      // Emit socket event
      await TrustScoreService.emitTrustScoreChange(
        vehicleId,
        trustResult.previousScore,
        trustResult.newScore,
        trustResult.eventId!,
        reason,
        change
      );

      res.json({
        success: true,
        message: 'Trust score updated successfully',
        data: {
          vehicleId,
          previousScore: trustResult.previousScore,
          newScore: trustResult.newScore,
          change,
          eventId: trustResult.eventId
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
