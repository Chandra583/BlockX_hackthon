import { Router } from 'express';
import { TelemetryController } from '../../controllers/telemetry/telemetry.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Get fraud alerts for a vehicle (temporarily without auth for testing)
router.get('/fraud-alerts/:vehicleId', TelemetryController.getFraudAlerts);

// Get latest OBD data for a vehicle (temporarily without auth for testing)
router.get('/latest-obd/:vehicleId', TelemetryController.getLatestOBDData);

// Get telemetry history for a vehicle (temporarily without auth for testing)
router.get('/history/:vehicleId', TelemetryController.getTelemetryHistory);

export default router;
