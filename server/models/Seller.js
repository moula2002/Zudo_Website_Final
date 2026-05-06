const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  businessName: { type: String },
  businessAddress: { type: String },
  phone: { type: String },
  role: { type: String, default: 'seller' }
}, { timestamps: true, collection: 'sellers' });

module.exports = mongoose.model('Seller', sellerSchema);
