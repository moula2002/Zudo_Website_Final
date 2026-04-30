const express = require('express');
const router = express.Router();
const { getSubcategories, getSubcategoriesByCategory } = require('../controllers/subcategoryController');

router.get('/', getSubcategories);
router.get('/category/:categoryId', getSubcategoriesByCategory);

module.exports = router;
