import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import userRoutes from './user/user.routes';
import deviceRoutes from './device/device.routes';
import blockchainRoutes from './blockchain/blockchain.routes';
// Phase 2 routes - Vehicle Management
import vehicleRoutes from './vehicle/vehicle.routes';
import vehicleBlockchainRoutes from './vehicleBlockchain.routes';
// Installation routes
import installsRoutes from './installs.routes';
import installationRequestRoutes from './installationRequest.routes';
import serviceInstallsRoutes from './serviceInstalls.routes';
import telemetryRoutes from './telemetry/telemetry.routes';
import trustRoutes from './trust/trust.routes';
// New routes - Service Providers, Batch Processing, Marketplace, Purchase
import marketplaceRoutes from './marketplace/marketplace.routes';
import purchaseRoutes from './purchase/purchase.routes';
// import serviceProviderRoutes from './admin/serviceProvider.routes';
// import batchProcessingRoutes from './admin/batchProcessing.routes';
// import mileageRoutes from './_mileage_disabled/mileage.routes';
// import documentRoutes from './_document_disabled/document.routes';

const router = Router();

// Mount Phase 1 routes (Authentication)
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/device', deviceRoutes);

// Mount Phase 5 routes (Blockchain)
router.use('/blockchain', blockchainRoutes);

// Mount Phase 2 routes (Vehicle Management)
router.use('/vehicles', vehicleRoutes);
router.use('/vehicles', vehicleBlockchainRoutes);

// Mount installation routes with proper prefix
router.use('/installs', installsRoutes);

// Mount new installation request routes with v1 prefix
router.use('/v1/installation-requests', installationRequestRoutes);

// Mount service installs routes
router.use('/service', serviceInstallsRoutes);

// Mount telemetry routes
router.use('/telemetry', telemetryRoutes);

// Mount trust routes
router.use('/trust', trustRoutes);

// Mount new feature routes
router.use('/marketplace', marketplaceRoutes);
router.use('/purchase', purchaseRoutes);

// Health check for the entire API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'BlockX API is healthy',
    data: {
      service: 'blockx-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Test CORS endpoint
router.get('/test-cors', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CORS test successful',
    data: {
      origin: req.headers.origin,
      method: req.method,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Present' : 'Not present',
        'origin': req.headers.origin,
        'referer': req.headers.referer,
      },
      cors: {
        allowedOrigins: [
          process.env.CORS_ORIGIN,
          process.env.FRONTEND_URL,
          'https://blockx.netlify.app',
          'https://block-x-frontend.netlify.app',
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174'
        ].filter(Boolean),
        frontendUrl: process.env.FRONTEND_URL,
        corsOrigin: process.env.CORS_ORIGIN
      },
      timestamp: new Date().toISOString()
    }
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'BlockX Reinventing Vehicle Trust with Blockchain API',
    data: {
      name: 'BlockX API',
      version: '1.0.0',
      description: 'Blockchain-powered vehicle marketplace preventing odometer fraud',
      phase: 'Phase 1 - Authentication System',
      endpoints: {
        // Phase 1 - Authentication
        auth: '/api/auth',
        admin: '/api/admin',
        users: '/api/users',
        device: '/api/device',
        blockchain: '/api/blockchain',
        
        // Phase 2 - Vehicle Management
        vehicles: '/api/vehicles',
        installs: '/api/installs',
        installationRequests: '/api/v1/installation-requests',
        
        // System
        health: '/api/health',
        info: '/api/info',
        testCors: '/api/test-cors'
      },
      features: {
        authentication: 'JWT-based with refresh tokens',
        authorization: 'Role-based access control (6 roles)',
        userManagement: 'Profile management and notifications',
        adminDashboard: 'User management and system monitoring',
        security: 'Rate limiting, input validation, audit trails'
      },
      documentation: '/api/docs',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;