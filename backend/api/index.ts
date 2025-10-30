import { app } from '../src/app';
import { connectDatabase } from '../src/config/database';
import serverless from 'serverless-http';

// Initialize database connection for serverless
let isConnected = false;

const initializeDatabase = async () => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
      console.log('✅ Database connected for serverless function');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
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

// Export serverless handler
export default serverless(app);
