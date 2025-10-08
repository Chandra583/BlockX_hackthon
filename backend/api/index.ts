import { app } from '../src/app';
import { connectDatabase } from '../src/config/database';

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

// Vercel serverless function handler
export default async (req: any, res: any) => {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
