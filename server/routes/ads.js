const express = require('express');
const router = express.Router();
const storage = require('../utils/context');

// @route   GET /api/ads/popup
// @desc    Get active popup ads for the current tenant
router.get('/popup', async (req, res) => {
  try {
    const { db } = storage.getStore();
    console.log(`[DEBUG] Fetching ads from DB: ${db.name}`);
    const PopupAd = db.model('PopupAd');
    
    const ads = await PopupAd.find({ 
      isActive: true,
      showOn: 'Home'
    }).sort({ createdAt: -1 });

    if (ads.length === 0) {
      const allAds = await PopupAd.find({});
      console.log(`[DEBUG] Query failed. Total ads in collection: ${allAds.length}`);
      if (allAds.length > 0) {
        console.log('[DEBUG] First ad sample:', { 
          isActive: allAds[0].isActive, 
          showOn: allAds[0].showOn,
          title: allAds[0].title 
        });
      }
    }

    console.log(`[DEBUG] Found ${ads.length} active popup ads for Home`);
    res.json(ads);
  } catch (err) {
    console.error('[ERROR] Failed to fetch popup ads:', err);
    res.status(500).json({ message: 'Error fetching ads' });
  }
});

module.exports = router;
