import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { app } from './app';
import { logger } from './utils/logger';
import { initializeSocketIO } from './utils/socketEmitter';
import { DailyMerkleJob } from './jobs/dailyMerkleJob';

// Import models to ensure they are registered with mongoose
import './models/core/User.model';
import './models/core/Vehicle.model';
import './models/core/Transaction.model';
import './models/core/MileageHistory.model';
import './models/core/VehicleDocument.model';
import './models/core/Device.model';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

// Global flag to track database connection
let isConnected = false;

/**
 * Initialize database connection for serverless
 */
const initializeDatabase = async (): Promise<void> => {
  // Check if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('♻️ Database already connected, reusing connection');
    return;
  }

  try {
    console.log('🔗 Initializing database connection...');
    console.log('📊 Current connection state:', mongoose.connection.readyState);
    
    // If connection exists but not ready, wait for it
    if (mongoose.connection.readyState === 2) { // connecting
      console.log('⏳ Connection in progress, waiting...');
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout after 45 seconds')), 45000);
      });
    } else if (mongoose.connection.readyState === 0) { // disconnected
      console.log('🚀 Attempting fresh database connection...');
      await connectDatabase();
    }
    
    isConnected = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    isConnected = false;
    throw error;
  }
};

/**
 * NOTE: For Vercel serverless deployment, database initialization is handled
 * in api/index.ts. This middleware is not needed in production serverless.
 * 
 * For traditional server deployments, database connection is established
 * once during startup in the startServer() function below.
 */

/**
 * Start the VERIDRIVE backend server (for local development)
 */
const startServer = async (): Promise<void> => {
  try {
    console.log('🔧 Starting server initialization...');
    
    // Connect to MongoDB
    console.log('🔗 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connected successfully');

    // Start the Express server
    console.log(`🚀 Starting Express server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`🚀 VERIDRIVE Backend Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔐 Health Check: http://localhost:${PORT}/api/health`);
    });

    // Initialize Socket.IO
    initializeSocketIO(server);

    // Start daily Merkle job
    console.log('🕐 Starting daily Merkle consolidation job...');
    DailyMerkleJob.start();
    console.log('✅ Daily Merkle job started');

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

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('❌ Unhandled Promise Rejection:', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', error);
    process.exit(1);
  }
};

// For Vercel deployment - export the app
export default app;

// For local development - start the server
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Starting server in development mode...');
  startServer().catch((error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
} 