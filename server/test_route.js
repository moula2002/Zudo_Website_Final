require('dotenv').config();
const mongoose = require('mongoose');
const CashCollector = require('./models/CashCollector');

const testRouteLogic = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const id = '69fc41007860360d852e5cb5';
    const collector = await CashCollector.findById(id);
    
    if (collector) {
      console.log('Collector found in DB:', JSON.stringify(collector, null, 2));
    } else {
      console.log('Collector NOT found in DB');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

testRouteLogic();
