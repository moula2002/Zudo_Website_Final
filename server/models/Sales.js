const mongoose = require('mongoose');
const storage = require('../utils/context');

const salesSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'sales' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  pincodes: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'sales' });

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'db') return conn.db;
      if (prop === 'schema') return salesSchema;
      
      const model = conn.models['Sales'] || conn.model('Sales', salesSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Sales Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Sales'] || conn.model('Sales', salesSchema);
    return new model(...args);
  }
});
