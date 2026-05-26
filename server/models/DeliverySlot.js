const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSameDay: {
    type: Boolean,
    default: false
  },
  orderedBeforeTime: {
    type: String,
    required: false
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }
}, { timestamps: true });

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema, 'deliveryslots');
