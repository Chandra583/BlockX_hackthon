import serverless from 'serverless-http';
import mongoose from 'mongoose';

// Import app WITHOUT models to avoid blocking initialization
import { app } from '../src/app';

// Lazy model loading function
let modelsLoaded = false;
const loadModels = async () => {
  if (modelsLoaded) return;
  modelsLoaded = true;
  // Dynamic imports to avoid blocking
  await Promise.all([
    import('../src/models/core/User.model'),
    import('../src/models/core/Vehicle.model'),
    import('../src/models/core/Transaction.model'),
    import('../src/models/core/MileageHistory.model'),
    import('../src/models/core/VehicleDocument.model'),
    import('../src/models/core/Device.model')
  ]);
};

// ---- Lazy DB initialization (only when needed) ----
let connecting = false;
const connectIfNeeded = async (): Promise<void> => {
  if (connecting || mongoose.connection.readyState === 1) return;
  connecting = true;
  try {
    // Load models first
    await loadModels();
    
    // Then connect to DB with short timeout
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set');
      return;
    }
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connect failed:', (err as any)?.message || err);
  } finally {
    connecting = false;
  }
};

// Lightweight health routes (instant - no DB required)
app.get('/health', (_req: any, res: any) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/api/health', (_req: any, res: any) => {
  res.status(200).json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', ts: new Date().toISOString() });
});

// Middleware to handle DB connection per request
app.use(async (req: any, res: any, next: any) => {
  const bypass = ['/', '/health', '/api/health', '/api/info', '/favicon.ico'];
  
  // Skip DB for health/info endpoints
  if (bypass.includes(req.path)) {
    return next();
  }
  
  // For other routes, try to connect
  if (mongoose.connection.readyState !== 1) {
    // Trigger connection in background and return 503
    connectIfNeeded().catch(() => {});
    return res.status(503).json({
      status: 'error',
      message: 'Database connecting. Please retry in a few seconds.',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// Export serverless handler with timeout configuration
export default serverless(app, {
  request: (_request: any, _event: any, context: any) => {
    context.callbackWaitsForEmptyEventLoop = false;
  }
});
