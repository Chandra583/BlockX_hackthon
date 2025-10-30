import { app } from '../src/app';
import { connectDatabase } from '../src/config/database';
import serverless from 'serverless-http';
import mongoose from 'mongoose';

// Initialize database connection for serverless
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

const initializeDatabase = async () => {
  // If already connected, skip
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = (async () => {
    try {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        isConnected = true;
        console.log('✅ Database already connected (reusing connection)');
        return;
      }

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

// Middleware to initialize database before each request
app.use(async (req: any, res: any, next: any) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
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
