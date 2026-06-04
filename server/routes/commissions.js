const express = require('express');
const router = express.Router();
const storage = require('../utils/context');
const { protect } = require('../middleware/auth');

// @route   GET /api/commissions/public/minimum-billing
// @desc    Get minimum billing settings for public apps (unauthenticated) using x-tenant-id / x-location header
// @access  Public
router.get('/public/minimum-billing', async (req, res) => {
  try {
    const { db } = storage.getStore();
    console.log(`[DEBUG] Fetching public minimum billing settings from DB: ${db.name}`);
    
    const settingsCollection = db.collection('settings');
    
    // Fetch setting documents
    const docB2B = await settingsCollection.findOne({ key: 'minimumBillAmountB2B' });
    const docB2C = await settingsCollection.findOne({ key: 'minimumBillAmountB2C' });
    const docLegacy = await settingsCollection.findOne({ key: 'minimumBillAmount' });

    // Fallbacks as per requirements
    const minimumBillAmountB2B = docB2B ? Number(docB2B.value) : (docLegacy ? Number(docLegacy.value) : 2000);
    const minimumBillAmountB2C = docB2C ? Number(docB2C.value) : (docLegacy ? Number(docLegacy.value) : 1000);

    res.json({
      minimumBillAmountB2B,
      minimumBillAmountB2C
    });
  } catch (err) {
    console.error('[ERROR] Failed to fetch public minimum billing:', err);
    res.status(500).json({ message: 'Error fetching minimum billing settings', error: err.message });
  }
});

// @route   GET /api/commissions/minimum-billing
// @desc    Get minimum billing settings
// @access  Private
router.get('/minimum-billing', protect, async (req, res) => {
  try {
    const { db } = storage.getStore();
    console.log(`[DEBUG] Fetching minimum billing settings from DB: ${db.name}`);
    
    const settingsCollection = db.collection('settings');
    
    // Fetch setting documents
    const docB2B = await settingsCollection.findOne({ key: 'minimumBillAmountB2B' });
    const docB2C = await settingsCollection.findOne({ key: 'minimumBillAmountB2C' });
    const docLegacy = await settingsCollection.findOne({ key: 'minimumBillAmount' });

    // Fallbacks as per requirements
    const minimumBillAmountB2B = docB2B ? Number(docB2B.value) : (docLegacy ? Number(docLegacy.value) : 2000);
    const minimumBillAmountB2C = docB2C ? Number(docB2C.value) : (docLegacy ? Number(docLegacy.value) : 1000);

    res.json({
      minimumBillAmountB2B,
      minimumBillAmountB2C
    });
  } catch (err) {
    console.error('[ERROR] Failed to fetch minimum billing:', err);
    res.status(500).json({ message: 'Error fetching minimum billing settings', error: err.message });
  }
});

// @route   PUT /api/commissions/minimum-billing
// @desc    Update minimum billing settings for B2B and B2C
// @access  Private (Admin/User)
router.put('/minimum-billing', protect, async (req, res) => {
  try {
    const { db } = storage.getStore();
    const { minimumBillAmountB2B, minimumBillAmountB2C } = req.body;

    if (minimumBillAmountB2B === undefined || minimumBillAmountB2C === undefined) {
      return res.status(400).json({ message: 'minimumBillAmountB2B and minimumBillAmountB2C are required' });
    }

    console.log(`[DEBUG] Updating minimum billing settings in DB: ${db.name}`);
    const settingsCollection = db.collection('settings');

    // Update minimumBillAmountB2B
    await settingsCollection.updateOne(
      { key: 'minimumBillAmountB2B' },
      { $set: { value: Number(minimumBillAmountB2B) } },
      { upsert: true }
    );

    // Update minimumBillAmountB2C
    await settingsCollection.updateOne(
      { key: 'minimumBillAmountB2C' },
      { $set: { value: Number(minimumBillAmountB2C) } },
      { upsert: true }
    );

    // Also update legacy key for backward compatibility
    await settingsCollection.updateOne(
      { key: 'minimumBillAmount' },
      { $set: { value: Number(minimumBillAmountB2B) } },
      { upsert: true }
    );

    res.json({
      message: 'Minimum billing settings updated successfully',
      minimumBillAmountB2B: Number(minimumBillAmountB2B),
      minimumBillAmountB2C: Number(minimumBillAmountB2C)
    });
  } catch (err) {
    console.error('[ERROR] Failed to update minimum billing:', err);
    res.status(500).json({ message: 'Error updating minimum billing settings', error: err.message });
  }
});

// @route   GET /api/commissions
// @desc    Get all commissions with populated category name
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const Commission = require('../models/Commission');
    const Category = require('../models/Category'); // ensure Model registration in tenancy context
    
    console.log(`[DEBUG] Fetching all commissions for tenant`);
    const commissions = await Commission.find()
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json(commissions);
  } catch (err) {
    console.error('[ERROR] Failed to fetch commissions:', err);
    res.status(500).json({ message: 'Error fetching commissions', error: err.message });
  }
});

// @route   POST /api/commissions
// @desc    Create a new commission setting
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const Commission = require('../models/Commission');
    const { categoryId, unit, commissionType, commissionValue } = req.body;

    if (!categoryId || !commissionType || commissionValue === undefined) {
      return res.status(400).json({ message: 'categoryId, commissionType, and commissionValue are required' });
    }

    const newCommission = new Commission({
      categoryId,
      unit: unit || '',
      commissionType,
      commissionValue: Number(commissionValue)
    });

    await newCommission.save();
    
    const populated = await Commission.findById(newCommission._id).populate('categoryId', 'name');
    res.status(201).json(populated);
  } catch (err) {
    console.error('[ERROR] Failed to create commission:', err);
    res.status(500).json({ message: 'Error creating commission', error: err.message });
  }
});

// @route   PUT /api/commissions/:id
// @desc    Update an existing commission setting
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const Commission = require('../models/Commission');
    const { categoryId, unit, commissionType, commissionValue } = req.body;

    let commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Commission setting not found' });
    }

    if (categoryId) commission.categoryId = categoryId;
    if (unit !== undefined) commission.unit = unit;
    if (commissionType) commission.commissionType = commissionType;
    if (commissionValue !== undefined) commission.commissionValue = Number(commissionValue);

    await commission.save();
    
    const populated = await Commission.findById(commission._id).populate('categoryId', 'name');
    res.json(populated);
  } catch (err) {
    console.error('[ERROR] Failed to update commission:', err);
    res.status(500).json({ message: 'Error updating commission', error: err.message });
  }
});

// @route   DELETE /api/commissions/:id
// @desc    Delete a commission setting
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const Commission = require('../models/Commission');
    const commission = await Commission.findById(req.params.id);
    
    if (!commission) {
      return res.status(404).json({ message: 'Commission setting not found' });
    }

    await commission.deleteOne();
    res.json({ message: 'Commission setting deleted successfully' });
  } catch (err) {
    console.error('[ERROR] Failed to delete commission:', err);
    res.status(500).json({ message: 'Error deleting commission', error: err.message });
  }
});

module.exports = router;
