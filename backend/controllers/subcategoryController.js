const Subcategory = require('../models/Subcategory');

exports.getSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find().populate('category');
        res.json(subcategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSubcategoriesByCategory = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({ category: req.params.categoryId });
        res.json(subcategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
