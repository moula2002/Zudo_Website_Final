const mongoose = require('mongoose');
const storage = require('../utils/context');

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
}, { timestamps: true });

// Ensure unique subcategory name within a category
subCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

module.exports = new Proxy({}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'schema') return subCategorySchema;
      const model = conn.models['SubCategory'] || conn.model('SubCategory', subCategorySchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] SubCategory Model Proxy Error (${prop}):`, err);
      throw err;
    }
  }
});
