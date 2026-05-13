const mongoose = require('mongoose');
const storage = require('../utils/context');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = new Proxy({}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      
      // Log connection name for debugging
      if (prop !== 'schema' && typeof prop === 'string' && !prop.startsWith('_')) {
        console.log(`[PROXY DEBUG] Category.${prop} using DB: ${conn.name || conn.db?.databaseName}`);
      }

      if (prop === 'schema') return categorySchema;
      
      const model = conn.models['Category'] || conn.model('Category', categorySchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Category Model Proxy Error (${prop}):`, err);
      throw err;
    }
  }
});
