import { Router } from 'express';
import BatchProcessingController from '../../controllers/admin/batchProcessing.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @route GET /api/admin/batch-processing/statistics
 * @desc Get batch processing statistics
 * @access Admin only
 */
router.get('/statistics', BatchProcessingController.getBatchStatistics);

/**
 * @route GET /api/admin/batch-processing/dashboard
 * @desc Get batch processing dashboard
 * @access Admin only
 */
router.get('/dashboard', BatchProcessingController.getBatchDashboard);

/**
 * @route GET /api/admin/batch-processing/batch/:batchId
 * @desc Get batch details
 * @access Admin only
 */
router.get('/batch/:batchId', BatchProcessingController.getBatchDetails);

/**
 * @route POST /api/admin/batch-processing/process-pending
 * @desc Manually process pending batches
 * @access Admin only
 */
router.post('/process-pending', BatchProcessingController.processPendingBatches);

/**
 * @route POST /api/admin/batch-processing/retry/:batchId
 * @desc Retry failed batch submission
 * @access Admin only
 */
router.post('/retry/:batchId', BatchProcessingController.retryBatchSubmission);

/**
 * @route GET /api/admin/batch-processing/device/:deviceId/history
 * @desc Get device batch history
 * @access Admin only
 */
router.get('/device/:deviceId/history', BatchProcessingController.getDeviceBatchHistory);

/**
 * @route PUT /api/admin/batch-processing/device/:deviceId/config
 * @desc Update batch configuration for device
 * @access Admin only
 */
router.put('/device/:deviceId/config', BatchProcessingController.updateBatchConfiguration);

/**
 * @route GET /api/admin/batch-processing/batch/:batchId/validation
 * @desc Get batch validation report
 * @access Admin only
 */
router.get('/batch/:batchId/validation', BatchProcessingController.getBatchValidationReport);

export default router;
