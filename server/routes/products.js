const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { protect } = require('../middleware/auth');

// Configure Multer for persistent storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP and PDF are allowed.'));
    }
  }
});

// @route   GET /api/products
// @desc    Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('categoryId').populate('subCategoryId');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a single product with image and/or pdf upload
router.post('/', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, categoryId, subCategoryId, price, b2bPrice, moq, unit } = req.body;
    
    let imageUrl = req.body.imageUrl || '';
    if (req.files && req.files['image']) {
      imageUrl = `/uploads/${req.files['image'][0].filename}`;
    }

    let pdfUrl = req.body.pdfUrl || '';
    if (req.files && req.files['pdf']) {
      pdfUrl = `/uploads/${req.files['pdf'][0].filename}`;
    }

    const product = await Product.create({
      name,
      categoryId,
      subCategoryId: subCategoryId || null,
      price,
      b2bPrice,
      moq,
      unit,
      imageUrl,
      pdfUrl,
      rating: 0
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products/bulk-upload
// @desc    Bulk upload products via Excel
router.post('/bulk-upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = [];
    for (const item of data) {
      // Find or create Category
      let category = await Category.findOne({ name: item.Category });
      if (!category) {
        category = await Category.create({ 
          name: item.Category, 
          imageUrl: item.CategoryImageUrl || '/uploads/default-category.png' 
        });
      }

      // Find or create SubCategory
      let subCategory = null;
      if (item.SubCategory) {
        subCategory = await SubCategory.findOne({ name: item.SubCategory, categoryId: category._id });
        if (!subCategory) {
          subCategory = await SubCategory.create({ 
            name: item.SubCategory, 
            imageUrl: item.SubCategoryImageUrl || '/uploads/default-subcategory.png',
            categoryId: category._id 
          });
        }
      }

      // Create Product
      const product = await Product.create({
        name: item.Name,
        categoryId: category._id,
        subCategoryId: subCategory ? subCategory._id : null,
        price: item.Price,
        b2bPrice: item.B2BPrice,
        moq: item.MOQ || 1,
        unit: item.Unit || 'pcs',
        imageUrl: item.ImageUrl || '/uploads/default-product.png',
        rating: item.Rating || 0
      });
      results.push(product);
    }

    // Clean up the uploaded Excel file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: `Successfully uploaded ${results.length} products`, count: results.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
