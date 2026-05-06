const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const Product = require('../models/Product');
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const pId = item.product || item.id || item._id;
      let name = item.name;
      let image = item.image || item.imageUrl;

      // If name or image is missing, fetch from database
      if (!name || !image) {
        const productData = await Product.findById(pId);
        if (productData) {
          name = name || productData.name;
          image = image || productData.imageUrl || productData.image;
        }
      }

      return {
        productId: pId,
        name: name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        image: image,
        product: {
          name: name || 'Unknown Product',
          image: image,
          imageUrl: image
        }
      };
    }));

    const order = new Order({
      userId: req.user._id,
      items: enrichedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      orderStatus: 'Pending'
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/myorders
// @desc    Get logged in user orders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
router.get('/admin/all', protect, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Authorization check: User can only cancel their own order
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.orderStatus = status;
    
    // If cancelled, also update payment status if it was COD
    if (status === 'Cancelled' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Cancelled';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ 
      message: 'Failed to update order status', 
      error: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

module.exports = router;
