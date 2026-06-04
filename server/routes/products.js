const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Seller = require('../models/Seller');
const { protect } = require('../middleware/auth');

// Helper to find commission for product
const findCommissionForProduct = (product, commissions) => {
  const pCatId = product.categoryId?._id?.toString() || product.categoryId?.toString();
  if (!pCatId) return null;

  const catCommissions = commissions.filter(c => c.categoryId?.toString() === pCatId);
  if (catCommissions.length === 0) return null;

  // 1. Try to find a unit-specific match (case-insensitive, normalized)
  if (product.unit) {
    const pUnitClean = product.unit.trim().toLowerCase();
    const unitMatch = catCommissions.find(c => {
      if (!c.unit) return false;
      const cUnitClean = c.unit.trim().toLowerCase();
      
      // Exact match
      if (cUnitClean === pUnitClean) return true;
      
      // Common plurals/singulars/abbreviations mapping
      if ((cUnitClean === 'pc' || cUnitClean === 'pcs') && 
          (pUnitClean === 'pc' || pUnitClean === 'pcs' || pUnitClean === 'piece' || pUnitClean === 'pieces')) return true;
      if ((cUnitClean === 'kg' || cUnitClean === 'kgs') && 
          (pUnitClean === 'kg' || pUnitClean === 'kgs' || pUnitClean === '1kg')) return true;
      if ((cUnitClean === 'ltr' || cUnitClean === 'ltrs' || cUnitClean === 'liter' || cUnitClean === 'litre') && 
          (pUnitClean === 'ltr' || pUnitClean === 'ltrs' || pUnitClean === 'liter' || pUnitClean === 'litre' || pUnitClean === '1ltr')) return true;
          
      return false;
    });
    if (unitMatch) return unitMatch;
  }

  // 2. Try to find a commission with no unit specified (fallback)
  const noUnitMatch = catCommissions.find(c => !c.unit || c.unit.trim() === '');
  if (noUnitMatch) return noUnitMatch;

  // 3. Fall back to the first available commission for this category
  return catCommissions[0];
};

// Helper to calculate commissioned price
const getCommissionedPrice = (productPrice, commission) => {
  if (!commission) return productPrice;
  let value = Number(commission.commissionValue) || 0;
  if (commission.commissionType === 'flat') {
    return productPrice + value;
  } else if (commission.commissionType === 'percentage') {
    return productPrice + Math.round(productPrice * value / 100);
  }
  return productPrice;
};

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

router.get('/', async (req, res) => {
  try {
    console.log('[DEBUG] Route GET /api/products called');
    const products = await Product.find().populate('categoryId').populate('subCategoryId');
    console.log(`[DEBUG] Found ${products.length} products`);

    // Fetch all commissions
    const Commission = require('../models/Commission');
    const commissions = await Commission.find();

    // Manually fetch seller names to be 100% sure
    const productsWithSellers = await Promise.all(products.map(async (product) => {
      try {
        const p = product.toObject();

        // Apply commission
        const comm = findCommissionForProduct(p, commissions);
        if (comm) {
          p.originalPrice = p.price;
          p.price = getCommissionedPrice(p.price, comm);
          if (p.b2bPrice) {
            p.originalB2BPrice = p.b2bPrice;
            p.b2bPrice = getCommissionedPrice(p.b2bPrice, comm);
          }

          // Apply to b2b variants
          if (p.b2b && Array.isArray(p.b2b)) {
            p.b2b = p.b2b.map(v => {
              const updatedVar = { ...v };
              if (updatedVar.price !== undefined) {
                updatedVar.originalPrice = updatedVar.price;
                updatedVar.price = getCommissionedPrice(updatedVar.price, comm);
              }
              // Apply to priceTiers inside variant
              if (updatedVar.priceTiers && Array.isArray(updatedVar.priceTiers)) {
                updatedVar.priceTiers = updatedVar.priceTiers.map(tier => {
                  const updatedTier = { ...tier };
                  if (updatedTier.price !== undefined) {
                    updatedTier.originalPrice = updatedTier.price;
                    updatedTier.price = getCommissionedPrice(updatedTier.price, comm);
                  }
                  return updatedTier;
                });
              }
              return updatedVar;
            });
          }

          // Apply to b2c variants
          if (p.b2c && Array.isArray(p.b2c)) {
            p.b2c = p.b2c.map(v => {
              const updatedVar = { ...v };
              if (updatedVar.price !== undefined) {
                updatedVar.originalPrice = updatedVar.price;
                updatedVar.price = getCommissionedPrice(updatedVar.price, comm);
              }
              return updatedVar;
            });
          }

          // Apply to top-level priceTiers
          if (p.priceTiers && Array.isArray(p.priceTiers)) {
            p.priceTiers = p.priceTiers.map(tier => {
              const updatedTier = { ...tier };
              if (updatedTier.price !== undefined) {
                updatedTier.originalPrice = updatedTier.price;
                updatedTier.price = getCommissionedPrice(updatedTier.price, comm);
              }
              return updatedTier;
            });
          }
        }

        if (p.sellerId) {
          // Try Mongoose first
          let seller = await Seller.findById(p.sellerId);

          // Fallback to direct DB query if Mongoose fails
          if (!seller) {
            const db = Product.db;
            if (db) {
              seller = await db.collection('sellers').findOne({
                _id: p.sellerId instanceof mongoose.Types.ObjectId ? p.sellerId : new mongoose.Types.ObjectId(p.sellerId)
              });
            }
          }

          if (seller) {
            p.sellerName = seller.businessName || seller.name;
            p.sellerId = seller;
          } else {
            p.sellerName = "Zudo Official";
          }
        }
        return p;
      } catch (err) {
        console.error(`[DEBUG] Error processing product ${product._id}:`, err);
        return product.toObject();
      }
    }));

    console.log('[DEBUG] Product mapping complete');
    res.json(productsWithSellers);
  } catch (error) {
    console.error('[DEBUG] Route GET /api/products FAILED:', error);
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
      sellerId: req.body.sellerId || null,
      sellerName: req.body.sellerName || 'Zudo Official',
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
