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

// ---- Fault-tolerant DB initialization (non-blocking) ----
let connecting = false;
const startConnectNonBlocking = async (): Promise<void> => {
  if (connecting || mongoose.connection.readyState === 1) return;
  connecting = true;
  try {
    // Longer timeout for cold starts (20s) to handle Vercel's serverless initialization
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout (20s)')), 20000));
    await Promise.race([connectDatabase(), timeoutPromise]);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connect attempt failed:', (err as any)?.message || err);
    // Don't throw - allow function to continue without DB for health checks
  } finally {
    connecting = false;
  }
};

// Kick off a background connection attempt on cold start, but DO NOT await
startConnectNonBlocking().catch((e) => console.error('connect bootstrap error', e));

// Lightweight health routes (instant)
app.get('/health', (_req: any, res: any) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/api/health', (_req: any, res: any) => {
  res.status(200).json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', ts: new Date().toISOString() });
});

// Attach dbConnected flag and fail fast with 503 for DB-dependent routes
app.use((req: any, res: any, next: any) => {
  req.dbConnected = mongoose.connection.readyState === 1;
  const bypass = ['/', '/health', '/api/health', '/favicon.ico'];
  if (bypass.includes(req.path)) return next();
  if (!req.dbConnected) {
    // Trigger a background reconnect attempt and return quickly
    startConnectNonBlocking().catch(() => {});
    return res.status(503).json({
      status: 'error',
      message: 'Database unavailable. Try again later.',
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
