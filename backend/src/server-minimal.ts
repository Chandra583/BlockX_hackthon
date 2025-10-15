import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'VERIDRIVE Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic info route
app.get('/api/info', (req, res) => {
  res.json({
    name: 'VERIDRIVE Backend API',
    version: '1.0.0',
    description: 'Anti-Fraud Vehicle Marketplace Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

/**
 * Start the minimal server
 */
const startServer = async (): Promise<void> => {
  try {
    console.log('🔧 Starting minimal server...');
    
    // Start the Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 VERIDRIVE Minimal Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Info: http://localhost:${PORT}/api/info`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('📴 Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('📴 Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
