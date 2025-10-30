import serverless from 'serverless-http';
import express from 'express';
import mongoose from 'mongoose';

// Create a minimal express app that loads the real app lazily
const app = express();

// Lazy-load the real app
let realApp: any = null;
let appLoading = false;

const loadApp = async () => {
  if (realApp) return realApp;
  if (appLoading) {
    // Wait for app to finish loading
    while (!realApp) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return realApp;
  }
  
  appLoading = true;
  try {
    console.log('⏳ Loading app...');
    const { app: loadedApp } = await import('../src/app');
    realApp = loadedApp;
    console.log('✅ App loaded');
    return realApp;
  } catch (err) {
    console.error('❌ App load failed:', err);
    appLoading = false;
    throw err;
  }
};

// Instant health endpoints (no app loading required)
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    app: realApp ? 'loaded' : 'loading',
    ts: new Date().toISOString() 
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok',
    app: realApp ? 'loaded' : 'loading',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString() 
  });
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// All other requests - load app if needed
app.use(async (req, res, next) => {
  try {
    // Load the real app
    const actualApp = await loadApp();
    // Forward the request to the real app
    actualApp(req, res, next);
  } catch (err) {
    console.error('❌ Request handling error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Application initialization failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Export serverless handler
export default serverless(app, {
  request: (_request: any, _event: any, context: any) => {
    context.callbackWaitsForEmptyEventLoop = false;
  }
});
