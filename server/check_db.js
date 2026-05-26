const mongoose = require('mongoose');
require('dotenv').config();

async function checkLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const centralDb = mongoose.connection.useDb('zudo-central');
    const locations = await centralDb.collection('locations').find({}).toArray();
    console.log('Locations in zudo-central:');
    console.table(locations.map(l => ({ city: l.city, dbName: l.dbName })));
    
    const pincodes = await centralDb.collection('pincodemappings').find({}).toArray();
    console.log('\nPincode Mappings (first 10):');
    console.table(pincodes.slice(0, 10).map(p => ({ pincode: p.pincode, city: p.city })));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkLocations();
