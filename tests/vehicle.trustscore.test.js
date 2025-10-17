const mongoose = require('mongoose');
const Vehicle = require('../backend/src/models/core/Vehicle.model').default;

describe('Vehicle TrustScore', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should have default trustScore of 100', async () => {
    const vehicle = new Vehicle({
      vin: '1HGBH41JXMN109186',
      vehicleNumber: 'KA01AB1234',
      ownerId: new mongoose.Types.ObjectId(),
      make: 'Honda',
      vehicleModel: 'Civic',
      year: 2020,
      color: 'Black',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 15000
    });
    
    await vehicle.save();
    expect(vehicle.trustScore).toBe(100);
  });

  it('should update trustScore when fraud alerts are added', async () => {
    const vehicle = new Vehicle({
      vin: '2HGBH41JXMN109187',
      vehicleNumber: 'KA01AB1235',
      ownerId: new mongoose.Types.ObjectId(),
      make: 'Toyota',
      vehicleModel: 'Camry',
      year: 2021,
      color: 'White',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      currentMileage: 20000,
      trustScore: 100
    });
    
    await vehicle.save();
    
    // Add a fraud alert
    await vehicle.addFraudAlert({
      alertType: 'odometer_rollback',
      severity: 'high',
      description: 'Odometer rollback detected',
      reportedBy: vehicle.ownerId,
      reportedAt: new Date(),
      status: 'active'
    });
    
    // Refresh vehicle from database
    const updatedVehicle = await Vehicle.findById(vehicle._id);
    expect(updatedVehicle.trustScore).toBeLessThan(100);
  });
});