import serverless from 'serverless-http';
import mongoose from 'mongoose';

// Import models to ensure they're registered before app initialization
import '../src/models/core/User.model';
import '../src/models/core/Vehicle.model';
import '../src/models/core/Transaction.model';
import '../src/models/core/MileageHistory.model';
import '../src/models/core/VehicleDocument.model';
import '../src/models/core/Device.model';

// Import app AFTER models
import { app } from '../src/app';
import { connectDatabase } from '../src/config/database';

// Initialize database connection for serverless
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

const initializeDatabase = async () => {
  // If already connected, skip
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('♻️ Database connection reused');
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection...');
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = (async () => {
    try {
      // Double-check connection state
      if (mongoose.connection.readyState === 1) {
        isConnected = true;
        console.log('✅ Database already connected (reusing connection)');
        return;
      }

      console.log('🔗 Establishing new database connection...');
      await connectDatabase();
      isConnected = true;
      console.log('✅ Database connected for serverless function');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

// Initialize database connection once at startup (non-blocking)
initializeDatabase().catch(error => {
  console.error('❌ Initial database connection failed:', error);
  console.log('⚠️  Will retry on first request that needs database');
});

// Middleware to ensure database is connected before each request
app.use(async (req: any, res: any, next: any) => {
  try {
    // Skip database connection for lightweight endpoints
    const pathsToBypass = ['/health', '/info', '/test-cors', '/', '/api/health', '/api/info', '/api/test-cors'];
    const isOptions = req.method === 'OPTIONS';
    const isBypass = pathsToBypass.includes(req.path) || req.path === '/' || req.url === '/';
    
    if (isOptions || isBypass) {
      console.log(`⏭️  Bypassing DB init for: ${req.method} ${req.path}`);
      return next();
    }

    // For non-bypass routes, ensure DB is connected
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Export serverless handler with timeout configuration
export default serverless(app, {
  request: (request: any, event: any, context: any) => {
    // Set context to not wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;
  }
});
