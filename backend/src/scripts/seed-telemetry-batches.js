/*
 Seed 10 days of TelemetryBatch data for a vehicle/device
 Usage: node src/scripts/seed-telemetry-batches.js <vehicleId> <deviceId> <installId>
*/
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

async function main() {
  const [,, vehicleId, deviceId, installId] = process.argv;
  if (!vehicleId || !deviceId || !installId) {
    console.log('Usage: node src/scripts/seed-telemetry-batches.js <vehicleId> <deviceId> <installId>');
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const telemetryColl = db.collection('telemetrybatches');
  const installsColl = db.collection('installationrequests');

  let resolvedInstallId = installId;
  if (!resolvedInstallId) {
    const latestInstall = await installsColl.find({ vehicleId: new ObjectId(vehicleId) }).sort({ createdAt: -1 }).limit(1).toArray();
    if (latestInstall && latestInstall[0]) {
      resolvedInstallId = latestInstall[0]._id.toString();
      console.log('Using latest installation request:', resolvedInstallId);
    } else {
      resolvedInstallId = new ObjectId().toString();
      console.log('No installation found; using generated installId:', resolvedInstallId);
    }
  }

  const baseMileage = 20; // starting mileage
  const batches = [];
  for (let i = 0; i < 10; i++) {
    const day = new Date();
    day.setDate(day.getDate() - (9 - i));
    day.setHours(18, 0, 0, 0);
    const distance = Math.floor(Math.random() * 60) + 10; // 10-70 km
    batches.push({
      installId: new ObjectId(resolvedInstallId),
      vehicleId: new ObjectId(vehicleId),
      deviceId,
      lastRecordedMileage: baseMileage + batches.reduce((a,b)=>a+b.distanceDelta,0) + distance,
      distanceDelta: distance,
      batchData: [],
      recordedAt: day
    });
  }

  await telemetryColl.insertMany(batches);
  console.log(`Seeded ${batches.length} telemetry batches for vehicle ${vehicleId}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });


