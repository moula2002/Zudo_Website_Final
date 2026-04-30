const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getUserOrders } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/myorders', auth, getUserOrders);

module.exports = router;
