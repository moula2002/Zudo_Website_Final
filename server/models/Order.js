const mongoose = require('mongoose');
const storage = require('../utils/context');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    normalPrice: {
      type: Number
    },
    image: String,
    sellerName: String,
    selectedPacketSize: String,
    isReturned: {
      type: Boolean,
      default: false
    },
    returnStatus: {
      type: String,
      enum: ['None', 'Return Requested', 'Return Approved', 'Return Rejected', 'Picked Up from Customer', 'Returned to Seller'],
      default: 'None'
    },
    returnReason: {
      type: String,
      default: null
    },
    returnImage: {
      type: String,
      default: null
    },
    returnComment: {
      type: String,
      default: null
    },
    refundAccountName: {
      type: String,
      default: null
    },
    refundBankName: {
      type: String,
      default: null
    },
    refundAccountNumber: {
      type: String,
      default: null
    },
    refundIfscCode: {
      type: String,
      default: null
    },
    // Add nested product for frontend compatibility
    product: {
      name: String,
      image: String,
      imageUrl: String,
      sellerName: String
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    pincode: String,
    state: String,
    lat: Number,
    lng: Number
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    default: 'Pending' // Match frontend "Completed" or "Pending"
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Partially Returned', 'Return Requested', 'Return Driver Assigned', 'Out for Return'],
    default: 'Processing'
  },
  deliveryOtp: {
    type: String,
    default: null
  },
  deliverySlot: {
    type: String,
    default: null
  },
  cashPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashCollector'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  returnReason: {
    type: String,
    default: null
  },
  returnImage: {
    type: String,
    default: null
  },
  returnComment: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = new Proxy(function () { }, {
  get(target, prop) {
    try {
      const context = storage.getStore();
      const conn = context?.db || mongoose.connection;
      const model = conn.models['Order'] || conn.model('Order', orderSchema);
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    } catch (err) {
      console.error(`[CRITICAL] Order Model Proxy Error (${prop}):`, err);
      throw err;
    }
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Order'] || conn.model('Order', orderSchema);
    return new model(...args);
  }
});
