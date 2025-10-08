import { Router } from 'express';
import { DeviceController } from '../../controllers/device/device.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * Device Status Routes for ESP32 Telematics
 */

// ESP32-specific middleware for handling device requests
const esp32Middleware = (req: Request, res: Response, next: NextFunction) => {
  // Log raw body for debugging
  console.log('ESP32 Raw Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    bodyType: typeof req.body,
    contentType: req.get('content-type'),
    contentLength: req.get('content-length')
  });

  // Handle case where body might be a string instead of parsed JSON
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
      console.log('Parsed string body to JSON:', req.body);
    } catch (error) {
      console.error('Failed to parse string body as JSON:', error);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JSON format in request body',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ensure body exists
  if (!req.body) {
    console.warn('Empty request body received');
    return res.status(400).json({
      status: 'error',
      message: 'Request body is required',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// POST /api/device/status - Receive ESP32 device status and vehicle data
router.post('/status', esp32Middleware, DeviceController.receiveDeviceStatus);

// Simple test endpoint for ESP32 debugging
router.post('/test', (req: Request, res: Response) => {
  console.log('ESP32 Test Endpoint Hit:', {
    body: req.body,
    headers: req.headers,
    contentType: req.get('content-type')
  });
  
  res.status(200).json({
    status: 'success',
    message: 'ESP32 test endpoint working',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Simple status endpoint without database operations
router.post('/simple-status', esp32Middleware, (req: Request, res: Response) => {
  try {
    const { deviceID, status, timestamp, message } = req.body;
    
    console.log('ESP32 Simple Status Endpoint Hit:', {
      deviceID,
      status,
      timestamp,
      message,
      bodyKeys: Object.keys(req.body || {})
    });
    
    // Basic validation only
    if (!deviceID || !status || !timestamp) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: deviceID, status, timestamp',
        received: { deviceID, status, timestamp },
        timestamp: new Date().toISOString()
      });
    }
    
    // Success response without database operations
    res.status(200).json({
      status: 'success',
      message: 'ESP32 simple status received (no database)',
      data: {
        deviceID,
        status,
        receivedAt: new Date().toISOString(),
        validatedFields: ['deviceID', 'status', 'timestamp']
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ESP32 Simple Status Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Simple status endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/device/status/:deviceId - Get device status by ID (authenticated)
router.get('/status/:deviceId', authenticate, authorize('admin', 'service'), DeviceController.getDeviceStatus);

// GET /api/device/list - List all devices (admin only)
router.get('/list', authenticate, authorize('admin'), DeviceController.listDevices);

// POST /api/device/register - Register new device (authenticated)
router.post('/register', authenticate, authorize('admin', 'service'), DeviceController.registerDevice);

export default router;
