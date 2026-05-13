const mongoose = require('mongoose');
const storage = require('../utils/context');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  licenseNumber: { type: String, required: true },
  vehicleDetails: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = new Proxy({}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'schema') return driverSchema;
      return conn.model('Driver')[prop];
    } catch (err) {
      console.error(`[CRITICAL] Driver Model Proxy Error (${prop}):`, err);
      throw err;
    }
  }
});
