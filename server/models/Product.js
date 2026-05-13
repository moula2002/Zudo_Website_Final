const mongoose = require('mongoose');
const storage = require('../utils/context');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }, // Optional as requested
  price: { type: Number, required: true },
  b2bPrice: { type: Number, required: true },
  moq: { type: Number, default: 1 },
  unit: { type: String, required: true },
  imageUrl: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  sellerName:{type:String, default: 'Zudo Official'},
  description:{ type: String },
  pdfUrl: { type: String },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'db') return conn.db;
      if (prop === 'schema') return productSchema;
      
      const model = conn.models['Product'] || conn.model('Product', productSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Product Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Product'] || conn.model('Product', productSchema);
    return new model(...args);
  }
});
