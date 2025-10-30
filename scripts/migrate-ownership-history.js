/*
 * Migration: Backfill vehicle.ownershipHistory and convert users.role -> users.roles
 * Usage: node scripts/migrate-ownership-history.js
 */
const mongoose = require('mongoose');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';
  await mongoose.connect(MONGODB_URI);

  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
  const vehicleSchema = new mongoose.Schema({}, { strict: false, collection: 'vehicles' });
  const User = mongoose.model('User_mig', userSchema);
  const Vehicle = mongoose.model('Vehicle_mig', vehicleSchema);

  console.log('Starting migration: ownershipHistory and roles array');

  // 1) Convert users.role string -> users.roles array
  const usersToUpdate = await User.find({ roles: { $exists: false }, role: { $exists: true } });
  let userCount = 0;
  for (const u of usersToUpdate) {
    const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
    u.roles = roles;
    await u.save();
    userCount++;
  }
  console.log(`Updated users to roles array: ${userCount}`);

  // 2) Backfill vehicles.ownershipHistory
  const vehicles = await Vehicle.find({ $or: [ { ownershipHistory: { $exists: false } }, { ownershipHistory: { $size: 0 } } ] });
  let vehicleCount = 0;
  for (const v of vehicles) {
    const createdAt = v.createdAt ? new Date(v.createdAt) : new Date();
    const soldAt = v.soldAt ? new Date(v.soldAt) : null;
    const ownerId = v.ownerId || v.ownerUserId;
    if (!ownerId) {
      v.ownershipHistory = [];
      await v.save();
      vehicleCount++;
      continue;
    }
    v.ownershipHistory = [
      {
        ownerUserId: ownerId,
        fromDate: createdAt,
        toDate: soldAt,
        note: 'Imported from legacy owner'
      }
    ];
    await v.save();
    vehicleCount++;
  }
  console.log(`Backfilled ownershipHistory for vehicles: ${vehicleCount}`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});


