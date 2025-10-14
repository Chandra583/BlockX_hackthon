import { Request, Response } from 'express';
import InstallJob from '../../models/core/InstallJob.model';
import { Device } from '../../models/core/Device.model';
import mongoose from 'mongoose';

export class InstallController {
  static async listInstallJobs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const skip = (page - 1) * limit;
      const status = (req.query.status as string) || undefined;
      const providerId = (req.query.providerId as string) || undefined;

      const filter: any = {};
      if (status) filter.status = status;
      if (providerId && mongoose.isValidObjectId(providerId)) filter.assignedProviderId = providerId;

      const [jobs, total] = await Promise.all([
        InstallJob.find(filter)
          .populate('deviceId', 'deviceID deviceType status')
          .populate('ownerId', 'firstName lastName email')
          .populate('assignedProviderId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        InstallJob.countDocuments(filter),
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Install jobs retrieved successfully',
        data: {
          jobs,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to fetch install jobs' });
    }
  }

  static async createAndAssignInstallJob(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, ownerId, vehicleId, assignedProviderId, notes, location } = req.body;

      if (!deviceId || !ownerId) {
        res.status(400).json({ status: 'error', message: 'deviceId and ownerId are required' });
        return;
      }

      const device = await Device.findById(deviceId);
      if (!device) {
        res.status(404).json({ status: 'error', message: 'Device not found' });
        return;
      }

      const job = await InstallJob.create({
        deviceId,
        ownerId,
        vehicleId,
        assignedProviderId,
        status: assignedProviderId ? 'assigned' : 'requested',
        notes,
        location,
        assignedAt: assignedProviderId ? new Date() : undefined,
      });

      res.status(201).json({ status: 'success', message: 'Install job created', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to create install job' });
    }
  }

  static async assignProvider(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const { providerId } = req.body;

      const job = await InstallJob.findById(jobId);
      if (!job) {
        res.status(404).json({ status: 'error', message: 'Install job not found' });
        return;
      }

      job.assignedProviderId = providerId;
      job.status = 'assigned';
      job.assignedAt = new Date();
      await job.save();

      res.status(200).json({ status: 'success', message: 'Provider assigned', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to assign provider' });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const { status } = req.body as { status: string };

      const allowed: string[] = ['requested', 'assigned', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        res.status(400).json({ status: 'error', message: 'Invalid status' });
        return;
      }

      const job = await InstallJob.findById(jobId);
      if (!job) {
        res.status(404).json({ status: 'error', message: 'Install job not found' });
        return;
      }

      job.status = status as any;
      if (status === 'accepted') job.acceptedAt = new Date();
      if (status === 'completed') job.completedAt = new Date();

      await job.save();

      res.status(200).json({ status: 'success', message: 'Status updated', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
  }
}

export default InstallController;

