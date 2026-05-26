const mongoose = require('mongoose');
const storage = require('../utils/context');

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

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      const model = conn.models['Driver'] || conn.model('Driver', driverSchema);
      if (prop === 'schema') return driverSchema;
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Driver Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Driver'] || conn.model('Driver', driverSchema);
    return new model(...args);
  }
});
