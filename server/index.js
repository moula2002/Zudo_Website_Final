require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Supported Locations and their Database names
const SUPPORTED_LOCATIONS = {
  'bangalore': 'zudo-bengaluru',
  'bengaluru': 'zudo-bengaluru',
  'mysore': 'zudo-mysore',
  'kozhikode': 'zudo-kozhikode',
  'coimbatore': 'zudo-coimbatore'
};

// Import all models to get their schemas
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Driver = require('./models/Driver');
const CashCollector = require('./models/CashCollector');
const Admin = require('./models/Admin');
const Seller = require('./models/Seller');
const PopupAd = require('./models/PopupAd');
const FeedPost = require('./models/FeedPost');
const Sales = require('./models/Sales');
const DeliverySlot = require('./models/DeliverySlot');
const Commission = require('./models/Commission');

const storage = require('./utils/context');

// Cache for allowed databases
let ALLOWED_DATABASES = new Set(['zudodb', 'zudo-central']);
const refreshAllowedDatabases = async () => {
  try {
    const centralDb = mongoose.connection.useDb('zudo-central', { useCache: true });
    const locations = await centralDb.collection('locations').find({}).toArray();

    // STRICT NORMALIZATION: Lowercase all dbNames for comparison
    const dbNames = locations.map(loc => (loc.dbName || loc.name)?.trim().toLowerCase()).filter(Boolean);
    ALLOWED_DATABASES = new Set(['zudodb', 'zudo-central', ...dbNames]);

    console.log('[INFO] Allowed Databases refreshed (normalized):', Array.from(ALLOWED_DATABASES));
  } catch (err) {
    console.error('[WARN] Failed to refresh allowed databases:', err.message);
  }
};

// Middleware to check location availability and set dynamic DB context
const setDynamicDB = (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.headers['x-location'];

    // Determine target database name
    let dbName = 'zudodb';

    if (tenantId) {
      let sanitizedId = tenantId.trim().toLowerCase();

      // Clean up double prefixes if they exist (e.g., "zudo-zudo-bengaluru" -> "zudo-bengaluru")
      while (sanitizedId.startsWith('zudo-zudo-')) {
        sanitizedId = sanitizedId.replace('zudo-zudo-', 'zudo-');
      }

      if (sanitizedId.startsWith('zudo-')) {
        // Only use if it's in our allowed list
        if (ALLOWED_DATABASES.has(sanitizedId)) {
          dbName = sanitizedId;
        } else {
          console.warn(`[WARN] Unauthorized DB attempt: ${sanitizedId}. Falling back to zudodb.`);
          dbName = 'zudodb';
        }
      } else {
        // Check city mapping
        const city = sanitizedId;
        const mappedDb = SUPPORTED_LOCATIONS[city];
        if (mappedDb && ALLOWED_DATABASES.has(mappedDb)) {
          dbName = mappedDb;
        } else {
          // If not in hardcoded map, check if it exists directly as a dbName in allowed list
          const foundDb = Array.from(ALLOWED_DATABASES).find(d => d === sanitizedId || d === `zudo-${sanitizedId}`);
          if (foundDb) {
            dbName = foundDb;
          } else {
            dbName = 'zudodb';
          }
        }
      }
    }

    // Double check that we aren't switching to a DB that isn't whitelisted
    if (!ALLOWED_DATABASES.has(dbName)) {
      dbName = 'zudodb';
    }

    console.log(`[DEBUG] Tenant ID: ${tenantId} -> Database: ${dbName}`);

    // Create or get the tenant-specific connection
    const db = mongoose.connection.useDb(dbName, { useCache: true });

    // Register all models on this connection immediately if not already registered
    const modelsToRegister = [
      { name: 'User', model: User },
      { name: 'Product', model: Product },
      { name: 'Category', model: Category },
      { name: 'SubCategory', model: SubCategory },
      { name: 'Order', model: Order },
      { name: 'Review', model: Review },
      { name: 'Driver', model: Driver },
      { name: 'CashCollector', model: CashCollector },
      { name: 'Admin', model: Admin },
      { name: 'Seller', model: Seller },
      { name: 'PopupAd', model: PopupAd },
      { name: 'FeedPost', model: FeedPost },
      { name: 'Sales', model: Sales },
      { name: 'DeliverySlot', model: DeliverySlot },
      { name: 'Commission', model: Commission }
    ];

    modelsToRegister.forEach(m => {
      if (!db.models[m.name]) {
        if (m.model && m.model.schema) {
          db.model(m.name, m.model.schema);
        } else {
          console.warn(`[WARN] Schema missing for model ${m.name}`);
        }
      }
    });

    // Run the rest of the request in this context
    storage.run({ db }, () => {
      next();
    });
  } catch (error) {
    console.error('[CRITICAL] setDynamicDB Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Database Error',
      error: error.message
    });
  }
};

// Tenancy routes (Central DB) - MUST be before setDynamicDB
app.use('/api/tenancy', require('./routes/tenancy'));

app.use(setDynamicDB);

// Connect to MongoDB (Default Connection)
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB (Main)');

    // Refresh allowed databases cache
    await refreshAllowedDatabases();

    // Periodically refresh cache (every 5 mins)
    setInterval(refreshAllowedDatabases, 5 * 60 * 1000);

    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/categories', require('./routes/categories'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/drivers', require('./routes/drivers'));
    app.use('/api/upload', require('./routes/uploads'));
    app.use('/api/orders', require('./routes/orders'));
    app.use('/api/subcategories', require('./routes/subcategories'));
    app.use('/api/reviews', require('./routes/reviews'));
    app.use('/api/cashcollectors', require('./routes/cashCollectors'));
    app.use('/api/contact', require('./routes/contact'));
    app.use('/api/ads', require('./routes/ads'));
    app.use('/api/feedposts', require('./routes/feedposts'));
    app.use('/api/sales', require('./routes/sales'));
    app.use('/api/deliveryslots', require('./routes/deliverySlots'));
    app.use('/api/commissions', require('./routes/commissions'));

    // Base route
    app.get('/', (req, res) => {
      res.send('Zudo API is running...');
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
