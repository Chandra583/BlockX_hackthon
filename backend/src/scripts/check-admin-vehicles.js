const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkAdminVehicles() {
  console.log('🔍 Checking vehicles owned by admin...');
  
  try {
    // Database connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';
    console.log(`🔗 Connecting to database: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    const vehiclesCollection = mongoose.connection.db.collection('vehicles');
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Find admin user
    const adminUser = await usersCollection.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('Admin user ID:', adminUser._id);
    
    // Find vehicles owned by admin
    const adminVehicles = await vehiclesCollection.find({ ownerId: adminUser._id }).toArray();
    
    console.log('Vehicles owned by admin:', adminVehicles.length);
    
    if (adminVehicles.length > 0) {
      adminVehicles.forEach((vehicle, index) => {
        console.log(`  ${index + 1}. VIN: ${vehicle.vin}, ID: ${vehicle._id}`);
      });
    } else {
      console.log('No vehicles found for admin user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkAdminVehicles();