import { Router } from 'express';
import ServiceProviderController from '../../controllers/admin/serviceProvider.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @route POST /api/admin/service-providers/register
 * @desc Register a new service provider
 * @access Admin only
 */
router.post('/register', ServiceProviderController.registerServiceProvider);

/**
 * @route GET /api/admin/service-providers
 * @desc Get all service providers with filtering
 * @access Admin only
 */
router.get('/', ServiceProviderController.getServiceProviders);

/**
 * @route GET /api/admin/service-providers/dashboard
 * @desc Get admin dashboard for service provider management
 * @access Admin only
 */
router.get('/dashboard', ServiceProviderController.getAdminDashboard);

/**
 * @route PUT /api/admin/service-providers/:providerId/verify
 * @desc Update service provider verification status
 * @access Admin only
 */
router.put('/:providerId/verify', ServiceProviderController.verifyServiceProvider);

/**
 * @route POST /api/admin/device-installation/request
 * @desc Request device installation
 * @access Admin only
 */
router.post('/device-installation/request', ServiceProviderController.requestDeviceInstallation);

/**
 * @route POST /api/admin/device-installation/assign
 * @desc Assign installation to service provider
 * @access Admin only
 */
router.post('/device-installation/assign', ServiceProviderController.assignInstallation);

/**
 * @route GET /api/admin/device-installation/pending
 * @desc Get pending installation requests
 * @access Admin only
 */
router.get('/device-installation/pending', ServiceProviderController.getPendingInstallations);

/**
 * @route PUT /api/admin/device-installation/:deviceId/status
 * @desc Update installation status
 * @access Admin only
 */
router.put('/device-installation/:deviceId/status', ServiceProviderController.updateInstallationStatus);

export default router;
