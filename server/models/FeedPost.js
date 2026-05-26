const mongoose = require('mongoose');
const storage = require('../utils/context');

const feedPostSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  discountPercent: { type: Number },
  offerCode: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'feedposts' });

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'db') return conn.db;
      if (prop === 'schema') return feedPostSchema;
      
      const model = conn.models['FeedPost'] || conn.model('FeedPost', feedPostSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] FeedPost Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['FeedPost'] || conn.model('FeedPost', feedPostSchema);
    return new model(...args);
  }
});
