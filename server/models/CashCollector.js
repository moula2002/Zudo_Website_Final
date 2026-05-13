const mongoose = require('mongoose');
const storage = require('../utils/context');

const cashCollectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  address: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = new Proxy({}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'schema') return cashCollectorSchema;
      return conn.model('CashCollector')[prop];
    } catch (err) {
      console.error(`[CRITICAL] CashCollector Model Proxy Error (${prop}):`, err);
      throw err;
    }
  }
});
