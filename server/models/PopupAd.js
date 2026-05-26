const mongoose = require('mongoose');

const popupAdSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  showOn: {
    type: String,
    default: 'Home'
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('PopupAd', popupAdSchema, 'popupads');
