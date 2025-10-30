import mongoose from 'mongoose';

/**
 * MongoDB connection options optimized for Vercel serverless
 */
const mongooseOptions = {
  maxPoolSize: 1, // Single connection for serverless
  serverSelectionTimeoutMS: 10000, // Reduced to fail fast - 10 seconds
  socketTimeoutMS: 45000, // Socket timeout - 45 seconds
  connectTimeoutMS: 10000, // Reduced connection timeout - 10 seconds
  bufferCommands: false, // Disable mongoose buffering
  retryWrites: true, // Enable retryable writes
  w: 'majority' as const, // Write concern
  heartbeatFrequencyMS: 30000, // Reduced frequency - 30 seconds
  family: 4, // Use IPv4, skip trying IPv6
  minPoolSize: 0, // Allow complete connection drain
};

/**
 * Connect to MongoDB database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive';
    
    console.log('🔧 Debug Info:');
    console.log('🌐 Environment:', process.env.NODE_ENV);
    console.log('📍 MongoDB URI exists:', !!process.env.MONGODB_URI);
    console.log('🔗 MongoDB URI preview:', mongoUri.substring(0, 50) + '...');
    console.log('🔑 JWT Secret exists:', !!process.env.JWT_SECRET);
    console.log('🔄 JWT Refresh Secret exists:', !!process.env.JWT_REFRESH_SECRET);
    console.log('⚙️ Connection Options:', JSON.stringify(mongooseOptions, null, 2));
    
    // Add connection event listeners
    mongoose.connection.on('connecting', () => {
      console.log('🟡 Connecting to MongoDB...');
    });
    
    mongoose.connection.on('connected', () => {
      console.log('🟢 Connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err);
    });
    
    await mongoose.connect(mongoUri, mongooseOptions);
    
    console.log(`✅ MongoDB connected successfully`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔢 Port: ${mongoose.connection.port}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    // Don't exit in production, let Vercel handle it
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      throw error; // Let Vercel catch the error
    }
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📴 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
  }
};

/**
 * MongoDB connection event handlers
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
});

// Handle app termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
}); 