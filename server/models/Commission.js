const mongoose = require('mongoose');
const storage = require('../utils/context');

const commissionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  unit: { type: String },
  commissionType: { type: String, enum: ['flat', 'percentage'], required: true },
  commissionValue: { type: Number, required: true }
}, { timestamps: true, collection: 'commissions' });

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'db') return conn.db;
      if (prop === 'schema') return commissionSchema;
      
      const model = conn.models['Commission'] || conn.model('Commission', commissionSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Commission Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Commission'] || conn.model('Commission', commissionSchema);
    return new model(...args);
  }
});
