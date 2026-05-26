const express = require('express');
const router = express.Router();
const storage = require('../utils/context');

// @route   GET /api/deliveryslots
// @desc    Get active delivery slots for the current tenant
router.get('/', async (req, res) => {
  try {
    const { db } = storage.getStore();
    console.log(`[DEBUG] Fetching delivery slots from DB: ${db.name}`);
    const DeliverySlot = db.model('DeliverySlot');
    
    // Find all active slots for the location/tenant
    const slots = await DeliverySlot.find({ isActive: true });
    
    console.log(`[DEBUG] Found ${slots.length} active delivery slots`);
    res.json(slots);
  } catch (err) {
    console.error('[ERROR] Failed to fetch delivery slots:', err);
    res.status(500).json({ message: 'Error fetching delivery slots', error: err.message });
  }
});

module.exports = router;
