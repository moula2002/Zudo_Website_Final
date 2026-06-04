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

  // 1. Try to find a unit-specific match (case-insensitive, normalized)
  if (product.unit) {
    const pUnitClean = product.unit.trim().toLowerCase();
    const unitMatch = catCommissions.find(c => {
      if (!c.unit) return false;
      const cUnitClean = c.unit.trim().toLowerCase();
      
      // Exact match
      if (cUnitClean === pUnitClean) return true;
      
      // Common plurals/singulars/abbreviations mapping
      if ((cUnitClean === 'pc' || cUnitClean === 'pcs') && 
          (pUnitClean === 'pc' || pUnitClean === 'pcs' || pUnitClean === 'piece' || pUnitClean === 'pieces')) return true;
      if ((cUnitClean === 'kg' || cUnitClean === 'kgs') && 
          (pUnitClean === 'kg' || pUnitClean === 'kgs' || pUnitClean === '1kg')) return true;
      if ((cUnitClean === 'ltr' || cUnitClean === 'ltrs' || cUnitClean === 'liter' || cUnitClean === 'litre') && 
          (pUnitClean === 'ltr' || pUnitClean === 'ltrs' || pUnitClean === 'liter' || pUnitClean === 'litre' || pUnitClean === '1ltr')) return true;
          
      return false;
    });
    if (unitMatch) return unitMatch;
  }

  // 2. Try to find a commission with no unit specified (fallback)
  const noUnitMatch = catCommissions.find(c => !c.unit || c.unit.trim() === '');
  if (noUnitMatch) return noUnitMatch;

  // 3. Fall back to the first available commission for this category
  return catCommissions[0];
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
    const { items, totalAmount, shippingAddress, paymentMethod, deliverySlot } = req.body;

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
      const selectedPacketSize = item.selectedPacketSize;

      // If name or image is missing, fetch from database
      const productData = await Product.findById(pId).populate('sellerId');
      if (productData) {
        name = name || productData.name;
        image = image || productData.imageUrl || productData.image;
        sellerName = sellerName || productData.sellerName || productData.sellerId?.businessName || productData.sellerId?.name || 'Zudo Official';

        const basePrice = productData.b2bPrice || productData.price;
        const comm = findCommissionForProduct(productData, commissions);
        if (basePrice > 0) {
          normalPrice = basePrice;
          finalPrice = getCommissionedPrice(basePrice, comm);
        } else {
          // Find pricing securely inside variant arrays matching selected size or commissioned price
          const allVariants = [...(productData.b2b || []), ...(productData.b2c || [])];
          const matchedVariant = allVariants.find(v => 
            (selectedPacketSize && v.packetSize === selectedPacketSize) ||
            getCommissionedPrice(v.price, comm) === item.price
          );

          if (matchedVariant) {
            normalPrice = matchedVariant.price;
            finalPrice = getCommissionedPrice(matchedVariant.price, comm);
          } else {
            normalPrice = item.price;
            finalPrice = item.price;
          }
        }
      }

      return {
        productId: pId,
        name: name || 'Unknown Product',
        quantity: item.quantity,
        price: finalPrice,
        normalPrice: normalPrice,
        image: image,
        selectedPacketSize: selectedPacketSize || null,
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
      deliveryOtp,
      deliverySlot: deliverySlot || null
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

// Helper to recalculate global orderStatus based on item return statuses
const updateGlobalStatus = (order) => {
  const allItems = order.items;
  const returnedCount = allItems.filter(i => i.returnStatus === 'Returned to Seller' || i.isReturned).length;
  const requestedCount = allItems.filter(i => i.returnStatus === 'Return Requested').length;
  const approvedCount = allItems.filter(i => i.returnStatus === 'Return Approved').length;
  const pickedUpCount = allItems.filter(i => i.returnStatus === 'Picked Up from Customer').length;

  const hasActiveReturn = requestedCount > 0 || approvedCount > 0 || pickedUpCount > 0;

  if (hasActiveReturn) {
    if (pickedUpCount > 0) {
      order.orderStatus = 'Out for Return';
    } else if (approvedCount > 0) {
      if (order.orderStatus !== 'Return Driver Assigned') {
        order.orderStatus = 'Return Requested';
      }
    } else if (requestedCount > 0) {
      order.orderStatus = 'Return Requested';
    }
  } else {
    if (returnedCount === allItems.length) {
      order.orderStatus = 'Returned';
    } else if (returnedCount > 0) {
      order.orderStatus = 'Partially Returned';
    } else {
      order.orderStatus = 'Delivered';
    }
  }
};

// Helper for item return logic (reused across POST and legacy PUT)
const handleItemReturnRequest = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const itemId = req.params.itemId;
    const { returnReason, returnComment, returnImage, reason, comment, image, refundAccountName, refundBankName, refundAccountNumber, refundIfscCode } = req.body;

    const actualReason = returnReason || reason;
    const actualComment = returnComment || comment;
    const actualImage = returnImage || image;

    if (!actualReason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check: User can only return items from their own order
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Find the item
    const item = order.items.id(itemId) || order.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    if (item.returnStatus && item.returnStatus !== 'None') {
      return res.status(400).json({ message: 'Return has already been requested or processed for this item' });
    }

    // Update item status
    item.returnStatus = 'Return Requested';
    item.returnReason = actualReason;
    item.returnComment = actualComment || null;
    item.returnImage = actualImage || null;
    item.refundAccountName = refundAccountName || null;
    item.refundBankName = refundBankName || null;
    item.refundAccountNumber = refundAccountNumber || null;
    item.refundIfscCode = refundIfscCode || null;

    // Update global status
    order.orderStatus = 'Return Requested';

    await order.save();

    // Fetch fully populated order to return
    const populatedOrder = await Order.findById(orderId)
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

    // Send email notification for Return Request
    try {
      const adminEmail = process.env.EMAIL_USER;
      const userEmail = req.user.email;
      const orderIdDisplay = order._id.toString().slice(-6).toUpperCase();

      // 1. Send to Admin
      await sendEmail({
        to: adminEmail,
        subject: `Item Return Request: Order #${orderIdDisplay}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">New Item Return Request</h1>
            </div>
            <div style="padding: 20px;">
              <p><strong>Order ID:</strong> #${orderIdDisplay}</p>
              <p><strong>Customer:</strong> ${req.user.name} (${req.user.email})</p>
              <p><strong>Item to Return:</strong> ${item.name} (Qty: ${item.quantity})</p>
              <p><strong>Reason:</strong> ${actualReason}</p>
              <p><strong>Comment:</strong> ${actualComment || 'No comment'}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
              <p style="margin: 0; font-weight: bold; color: #107569;">Refund Bank Account Details:</p>
              <p style="margin: 5px 0 0 0;"><strong>Name:</strong> ${item.refundAccountName || 'N/A'}</p>
              <p style="margin: 2px 0 0 0;"><strong>Bank Name:</strong> ${item.refundBankName || 'N/A'}</p>
              <p style="margin: 2px 0 0 0;"><strong>Account Number:</strong> ${item.refundAccountNumber || 'N/A'}</p>
              <p style="margin: 2px 0 0 0;"><strong>IFSC Code:</strong> ${item.refundIfscCode || 'N/A'}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              ${actualImage ? `<p><strong>Evidence:</strong> <br/><img src="${actualImage}" style="max-width: 100%; border-radius: 10px; margin-top: 10px;"/></p>` : ''}
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
        subject: `Item Return Request Received: Order #${orderIdDisplay}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Hello ${req.user.name}!</h1>
            </div>
            <div style="padding: 20px;">
              <p>We have received your return request for <strong>${item.name}</strong> from <strong>Order #${orderIdDisplay}</strong>.</p>
              <p>Our team will review the details and evidence provided and get back to you shortly regarding the next steps.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Item:</strong> ${item.name}</p>
                <p style="margin: 0;"><strong>Reason:</strong> ${actualReason}</p>
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
      console.error('Item return email notification failed:', emailError);
    }

    res.json({
      message: 'Return requested successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Item return error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/orders/:orderId/items/:itemId/return
// @desc    Request a return for an item
// @access  Private (Customer)
router.post('/:orderId/items/:itemId/return', protect, handleItemReturnRequest);

// @route   PUT /api/orders/:id/items/:itemId/return
// @desc    Legacy endpoint for item return (Backwards compatibility)
// @access  Private
router.put('/:id/items/:itemId/return', protect, handleItemReturnRequest);

// @route   PUT /api/orders/:orderId/items/:itemId/return-status
// @desc    Approve / Reject / Update Return Status
// @access  Private (Admin / Seller)
router.put('/:orderId/items/:itemId/return-status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Role check: Only admin or seller can update return status
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Not authorized to update return status' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the item
    const item = order.items.id(req.params.itemId) || order.items.find(i => i._id.toString() === req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    // Update return status
    item.returnStatus = status;
    
    // For legacy compatibility, mark isReturned if status is Returned to Seller
    if (status === 'Returned to Seller') {
      item.isReturned = true;
    } else if (status === 'Return Rejected') {
      item.isReturned = false;
    }

    // Update global orderStatus based on all items
    updateGlobalStatus(order);

    await order.save();

    // Fetch fully populated order to return
    const populatedOrder = await Order.findById(order.id)
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

    res.json({
      message: 'Return status updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Update return status error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
