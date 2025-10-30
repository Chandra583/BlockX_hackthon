import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Lazy load the Express app
let app: any = null;
let dbConnected = false;

async function loadApp() {
  if (app) return app;
  
  console.log('⏳ Loading Express app...');
  const { app: expressApp } = await import('../src/app');
  app = expressApp;
  console.log('✅ Express app loaded');
  
  return app;
}

async function connectDB() {
  if (dbConnected || mongoose.connection.readyState === 1) {
    return true;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set');
      return false;
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    dbConnected = true;
    console.log('✅ MongoDB connected');
    return true;
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err.message);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Load the Express app
    const expressApp = await loadApp();
    
    // Connect to database in background (non-blocking)
    connectDB().catch(e => console.error('DB connect error:', e));
    
    // Convert Vercel request to Express-compatible format
    // @ts-ignore
    expressApp(req, res);
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}
