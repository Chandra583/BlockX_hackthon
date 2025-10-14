import { Request, Response } from 'express';
import InstallJob from '../../models/core/InstallJob.model';

export class ProviderInstallController {
  static async listMyJobs(req: Request, res: Response): Promise<void> {
    try {
      const providerId = req.user?.id;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        InstallJob.find({ assignedProviderId: providerId })
          .populate('deviceId', 'deviceID deviceType status')
          .populate('ownerId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        InstallJob.countDocuments({ assignedProviderId: providerId })
      ]);

      res.status(200).json({
        status: 'success',
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
      res.status(500).json({ status: 'error', message: 'Failed to fetch jobs' });
    }
  }

  static async acceptJob(req: Request, res: Response): Promise<void> {
    try {
      const providerId = req.user?.id;
      const { jobId } = req.params;

      const job = await InstallJob.findOne({ _id: jobId, assignedProviderId: providerId });
      if (!job) {
        res.status(404).json({ status: 'error', message: 'Job not found' });
        return;
      }
      job.status = 'accepted';
      job.acceptedAt = new Date();
      await job.save();

      res.status(200).json({ status: 'success', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to accept job' });
    }
  }

  static async declineJob(req: Request, res: Response): Promise<void> {
    try {
      const providerId = req.user?.id;
      const { jobId } = req.params;

      const job = await InstallJob.findOne({ _id: jobId, assignedProviderId: providerId });
      if (!job) {
        res.status(404).json({ status: 'error', message: 'Job not found' });
        return;
      }
      job.status = 'declined';
      await job.save();

      res.status(200).json({ status: 'success', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to decline job' });
    }
  }

  static async updateProgress(req: Request, res: Response): Promise<void> {
    try {
      const providerId = req.user?.id;
      const { jobId } = req.params;
      const { status } = req.body as { status: 'in_progress' | 'completed' | 'cancelled' };

      const allowed = ['in_progress', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        res.status(400).json({ status: 'error', message: 'Invalid status' });
        return;
      }

      const job = await InstallJob.findOne({ _id: jobId, assignedProviderId: providerId });
      if (!job) {
        res.status(404).json({ status: 'error', message: 'Job not found' });
        return;
      }

      job.status = status as any;
      if (status === 'completed') job.completedAt = new Date();
      await job.save();

      res.status(200).json({ status: 'success', data: { job } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
  }
}

export default ProviderInstallController;

