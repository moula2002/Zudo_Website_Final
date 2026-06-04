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

// @route   PUT /api/deliveryslots/cutoff
// @desc    Update SameDayCutoff for the current tenant/location
router.put('/cutoff', async (req, res) => {
  try {
    const { db } = storage.getStore();
    const { cutoffTime } = req.body;
    
    if (!cutoffTime) {
      return res.status(400).json({ message: 'cutoffTime is required' });
    }
    
    console.log(`[DEBUG] Updating SameDayCutoff in DB: ${db.name} to ${cutoffTime}`);
    const DeliverySlot = db.model('DeliverySlot');
    
    let slot = await DeliverySlot.findOne({
      $or: [
        { isSameDay: true, SameDayCutoff: { $exists: true } },
        { globalIsSameDay: true, SameDayCutoff: { $exists: true } }
      ]
    });
    
    if (slot) {
      slot.SameDayCutoff = cutoffTime;
      slot.isSameDay = true;
      slot.globalIsSameDay = true;
      slot.isActive = true;
      await slot.save();
    } else {
      const anySlot = await DeliverySlot.findOne({});
      const locationId = anySlot ? anySlot.locationId : null;
      
      slot = new DeliverySlot({
        isSameDay: true,
        globalIsSameDay: true,
        SameDayCutoff: cutoffTime,
        locationId,
        isActive: true
      });
      await slot.save();
    }
    
    console.log(`[DEBUG] SameDayCutoff updated:`, slot);
    res.json({ message: 'SameDayCutoff updated successfully', slot });
  } catch (err) {
    console.error('[ERROR] Failed to update SameDayCutoff:', err);
    res.status(500).json({ message: 'Error updating SameDayCutoff', error: err.message });
  }
});

module.exports = router;
