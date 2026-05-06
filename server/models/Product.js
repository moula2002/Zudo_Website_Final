const mongoose = require('mongoose');

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

module.exports = mongoose.model('Product', productSchema);
