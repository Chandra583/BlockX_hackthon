import { Router } from 'express';
import { VehicleBlockchainController } from '../controllers/vehicleBlockchain.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/vehicles/:vehicleId/blockchain-history
 * @desc    Get all blockchain transactions for a vehicle
 * @access  Private
 */
router.get(
  '/:vehicleId/blockchain-history',
  authenticate,
  VehicleBlockchainController.getVehicleBlockchainHistory
);

/**
 * @route   GET /api/vehicles/:vehicleId/blockchain-history/device-install
 * @desc    Get device installation transaction for a vehicle
 * @access  Private
 */
router.get(
  '/:vehicleId/blockchain-history/device-install',
  authenticate,
  VehicleBlockchainController.getDeviceInstallTransaction
);

/**
 * @route   GET /api/vehicles/:vehicleId/blockchain-history/registration
 * @desc    Get registration transaction for a vehicle
 * @access  Private
 */
router.get(
  '/:vehicleId/blockchain-history/registration',
  authenticate,
  VehicleBlockchainController.getRegistrationTransaction
);

export default router;

