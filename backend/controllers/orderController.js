const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

exports.createOrder = async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
        const userId = req.user.id; // From auth middleware

        let orderData = {
            user: userId,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod
        };

        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: totalAmount * 100, // amount in smallest currency unit
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            };
            const rzpOrder = await razorpay.orders.create(options);
            orderData.razorpayOrderId = rzpOrder.id;
        }

        const order = new Order(orderData);
        await order.save();

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { paymentStatus: 'Completed', razorpayPaymentId: razorpay_payment_id }
            );
            res.json({ message: "Payment verified successfully" });
        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
