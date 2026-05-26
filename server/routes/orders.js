const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Driver = require('../models/Driver');
const CashCollector = require('../models/CashCollector');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const mongoose = require('mongoose');

// Helper to find commission for product
const findCommissionForProduct = (product, commissions) => {
  const pCatId = product.categoryId?._id?.toString() || product.categoryId?.toString();
  if (!pCatId) return null;
  
  const catCommissions = commissions.filter(c => c.categoryId?.toString() === pCatId);
  if (catCommissions.length === 0) return null;
  
  if (product.unit) {
    const unitMatch = catCommissions.find(c => c.unit && c.unit.trim().toLowerCase() === product.unit.trim().toLowerCase());
    if (unitMatch) return unitMatch;
  }
  
  const fallbackMatch = catCommissions.find(c => !c.unit);
  if (fallbackMatch) return fallbackMatch;
  
  return catCommissions[0] || null;
};

// Helper to calculate commissioned price
const getCommissionedPrice = (productPrice, commission) => {
  if (!commission) return productPrice;
  let value = Number(commission.commissionValue) || 0;
  if (commission.commissionType === 'flat') {
    return productPrice + value;
  } else if (commission.commissionType === 'percentage') {
    return productPrice + Math.round(productPrice * value / 100);
  }
  return productPrice;
};

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Enforce Minimum Order Value for B2B/Business/Seller roles
    const isB2BUser = ['b2b', 'business', 'seller'].includes(req.user.role);
    if (isB2BUser && totalAmount < 2000) {
      return res.status(400).json({ message: 'Minimum order value for B2B/Business account is ₹2000' });
    }

    const Product = require('../models/Product');
    const Commission = require('../models/Commission');
    const commissions = await Commission.find();

    const enrichedItems = await Promise.all(items.map(async (item) => {
      const pId = item.product || item.id || item._id;
      let name = item.name;
      let image = item.image || item.imageUrl;
      let sellerName = item.sellerName;
      let normalPrice = item.price; // fallback
      let finalPrice = item.price; // fallback

      // If name or image is missing, fetch from database
      const productData = await Product.findById(pId).populate('sellerId');
      if (productData) {
        name = name || productData.name;
        image = image || productData.imageUrl || productData.image;
        sellerName = sellerName || productData.sellerName || productData.sellerId?.businessName || productData.sellerId?.name || 'Zudo Official';
        
        // Base normal price is always the B2B price (or retail price if B2B price is not set)
        const basePrice = productData.b2bPrice || productData.price;
        normalPrice = basePrice;

        // Apply commission to get commissioned price
        const comm = findCommissionForProduct(productData, commissions);
        finalPrice = getCommissionedPrice(basePrice, comm);
      }

      return {
        productId: pId,
        name: name || 'Unknown Product',
        quantity: item.quantity,
        price: finalPrice,
        normalPrice: normalPrice,
        image: image,
        sellerName: sellerName || 'Zudo Official',
        product: {
          name: name || 'Unknown Product',
          image: image,
          imageUrl: image,
          sellerName: sellerName || 'Zudo Official'
        }
      };
    }));

    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = new Order({
      userId: req.user._id,
      items: enrichedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      orderStatus: 'Pending',
      deliveryOtp
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
    const orders = await Order.find({ userId: req.user._id })
      .populate('userId', 'name email role businessName gstNumber')
      .populate('cashPersonId')
      .populate('driverId')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'sellerId',
          select: 'name businessName'
        }
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {

    console.error('Fetch orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID with populated driver
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email role businessName gstNumber')
      .populate('cashPersonId')
      .populate('driverId')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'sellerId',
          select: 'name businessName'
        }
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Fetch order by ID error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
router.get('/admin/all', protect, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email role')
      .populate('cashPersonId')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'sellerId',
          select: 'name businessName'
        }
      })
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
    
    // If status is 'Returned', save reason and image
    if (status === 'Returned') {
      order.returnReason = req.body.returnReason || null;
      order.returnComment = req.body.returnComment || null;
      order.returnImage = req.body.returnImage || null;
    }
    
    // If cancelled, also update payment status if it was COD
    if (status === 'Cancelled' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Cancelled';
    }

    await order.save();

    // Send email notification for Return Request
    if (status === 'Returned') {
      try {
        const adminEmail = process.env.EMAIL_USER;
        const userEmail = req.user.email;
        const orderId = order._id.toString().slice(-6).toUpperCase();

        // 1. Send to Admin
        await sendEmail({
          to: adminEmail,
          subject: `Return Request: Order #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">New Return Request</h1>
              </div>
              <div style="padding: 20px;">
                <p><strong>Order ID:</strong> #${orderId}</p>
                <p><strong>Customer:</strong> ${req.user.name} (${req.user.email})</p>
                <p><strong>Reason:</strong> ${order.returnReason}</p>
                <p><strong>Comment:</strong> ${order.returnComment || 'No comment'}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                ${order.returnImage ? `<p><strong>Evidence:</strong> <br/><img src="${order.returnImage}" style="max-width: 100%; border-radius: 10px; margin-top: 10px;"/></p>` : ''}
              </div>
              <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
                Sent from Zudo Admin Panel
              </div>
            </div>
          `
        });

        // 2. Send confirmation to User
        await sendEmail({
          to: userEmail,
          subject: `Return Request Received: Order #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Hello ${req.user.name}!</h1>
              </div>
              <div style="padding: 20px;">
                <p>We have received your return request for <strong>Order #${orderId}</strong>.</p>
                <p>Our team will review the details and evidence provided and get back to you shortly regarding the next steps.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Reason:</strong> ${order.returnReason}</p>
                  <p style="margin: 0; font-size: 12px; color: #666; margin-top: 5px;">Your request is being processed.</p>
                </div>
                <p>Best regards,<br/><strong>Team Zudo</strong></p>
              </div>
              <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
                This is an automated response. Please do not reply directly to this email.
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Return request email notification failed:', emailError);
      }
    }

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

// @route   POST /api/orders/:id/delivery-otp
// @desc    Generate/Regenerate delivery OTP
// @access  Private (Admin only or system)
router.post('/:id/delivery-otp', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Generate new 4-digit OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = newOtp;
    
    await order.save();
    res.json({ 
      message: 'Delivery OTP updated successfully', 
      deliveryOtp: newOtp 
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
