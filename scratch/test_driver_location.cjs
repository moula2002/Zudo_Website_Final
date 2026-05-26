const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  licenseNumber: { type: String },
  vehicleDetails: { type: String },
  wallet: { type: Number, default: 0 },
  type: { type: String },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

async function run() {
  const uri = process.env.MONGO_URI || "mongodb+srv://root:root@cluster0.p18ex.mongodb.net/zudo-bengaluru?retryWrites=true&w=majority";
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  
  const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);
  
  const drivers = await Driver.find({});
  console.log(`Found ${drivers.length} drivers:`);
  for (const driver of drivers) {
    console.log({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      currentLocation: driver.currentLocation
    });
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
