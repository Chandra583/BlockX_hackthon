const mongoose = require('mongoose');
const Vehicle = require('../backend/src/models/core/Vehicle.model').default;
const User = require('../backend/src/models/core/User.model').User;
const Install = require('../backend/src/models/Install.model').Install;

describe('Installation Flow', () => {
  let vehicleId, ownerId, adminId, serviceProviderId;
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    
    // Create test users
    const owner = await User.create({
      email: 'owner@test.com',
      password: 'password123',
      firstName: 'Vehicle',
      lastName: 'Owner',
      role: 'owner'
    });
    
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin'
    });
    
    const serviceProvider = await User.create({
      email: 'sp@test.com',
      password: 'password123',
      firstName: 'Service',
      lastName: 'Provider',
      role: 'service'
    });
    
    ownerId = owner._id;
    adminId = admin._id;
    serviceProviderId = serviceProvider._id;
    
    // Create test vehicle
    const vehicle = await Vehicle.create({
      vin: '1HGBH41JXMN109186',
      vehicleNumber: 'KA01AB1234',
      ownerId: ownerId,
      make: 'Honda',
      vehicleModel: 'Civic',
      year: 2020,
      color: 'Black',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 15000
    });
    
    vehicleId = vehicle._id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await Vehicle.deleteMany({});
    await User.deleteMany({});
    await Install.deleteMany({});
    await mongoose.connection.close();
  });
  
  it('should allow owner to request device installation', async () => {
    const installRequest = new Install({
      vehicleId: vehicleId,
      ownerId: ownerId,
      status: 'requested',
      notes: 'Please install device',
      priority: 'medium',
      requestedAt: new Date()
    });
    
    await installRequest.save();
    
    expect(installRequest.status).toBe('requested');
    expect(installRequest.vehicleId.toString()).toBe(vehicleId.toString());
  });
  
  it('should allow admin to assign installation to service provider', async () => {
    // First, get the install request
    const install = await Install.findOne({ vehicleId });
    
    install.serviceProviderId = serviceProviderId;
    install.status = 'assigned';
    install.assignedAt = new Date();
    
    await install.save();
    
    expect(install.status).toBe('assigned');
    expect(install.serviceProviderId.toString()).toBe(serviceProviderId.toString());
  });
  
  it('should allow service provider to complete installation', async () => {
    // Get the assigned install
    const install = await Install.findOne({ vehicleId });
    
    install.deviceId = 'ESP32_001234';
    install.status = 'completed';
    install.completedAt = new Date();
    
    await install.save();
    
    expect(install.status).toBe('completed');
    expect(install.deviceId).toBe('ESP32_001234');
  });
});