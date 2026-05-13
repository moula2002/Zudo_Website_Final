const mongoose = require('mongoose');
const storage = require('../utils/context');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  businessName: { type: String },
  businessAddress: { type: String },
  phone: { type: String },
  role: { type: String, default: 'seller' }
}, { timestamps: true, collection: 'sellers' });

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'schema') return sellerSchema;
      const model = conn.models['Seller'] || conn.model('Seller', sellerSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Seller Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Seller'] || conn.model('Seller', sellerSchema);
    return new model(...args);
  }
});
