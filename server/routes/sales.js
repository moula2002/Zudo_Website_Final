const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');

// Get salesperson details matching the pincode
router.get('/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode is required' });
    }

    const salesperson = await Sales.findOne({ pincodes: pincode });

    if (!salesperson) {
      return res.json({ success: false, message: 'No sales person assigned to this pincode' });
    }

    return res.json({
      success: true,
      salesperson: {
        name: salesperson.name,
        email: salesperson.email,
        phone: salesperson.phone
      }
    });
  } catch (error) {
    console.error('Error matching salesperson:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving salesperson details' });
  }
});

module.exports = router;
