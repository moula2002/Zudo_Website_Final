const mongoose = require('mongoose');
const storage = require('../utils/context');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = new Proxy({}, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      if (prop === 'schema') return reviewSchema;
      return conn.model('Review')[prop];
    } catch (err) {
      console.error(`[CRITICAL] Review Model Proxy Error (${prop}):`, err);
      throw err;
    }
  }
});
