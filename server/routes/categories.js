const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { protect } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    console.log('[DEBUG] Route GET /api/categories called');
    const categories = await Category.find();
    console.log(`[DEBUG] Found ${categories.length} categories`);
    
    const result = await Promise.all(categories.map(async (cat) => {
      try {
        const subCats = await SubCategory.find({ categoryId: cat._id });
        return { ...cat._doc, subCategories: subCats };
      } catch (err) {
        console.error(`[DEBUG] Error fetching subcategories for category ${cat._id}:`, err);
        return { ...cat._doc, subCategories: [] };
      }
    }));
    
    console.log('[DEBUG] Category mapping complete');
    res.json(result);
  } catch (error) {
    console.error('[DEBUG] Route GET /api/categories FAILED:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create a category
router.post('/', protect, async (req, res) => {
  const { name, imageUrl } = req.body;
  try {
    const category = await Category.create({ name, imageUrl });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/categories/sub
// @desc    Create a subcategory
router.post('/sub', protect, async (req, res) => {
  const { name, imageUrl, categoryId } = req.body;
  try {
    const subCategory = await SubCategory.create({ name, imageUrl, categoryId });
    res.status(201).json(subCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
