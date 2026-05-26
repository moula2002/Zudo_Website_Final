const mongoose = require('mongoose');
require('dotenv').config();

async function checkKozhikode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const centralDb = mongoose.connection.useDb('zudo-central');
    
    const kozhikodeLoc = await centralDb.collection('locations').findOne({ city: 'Kozhikode' });
    console.log('Kozhikode Location Entry:', kozhikodeLoc);
    
    const kozhikodePincodes = await centralDb.collection('pincodemappings').find({ city: 'Kozhikode' }).toArray();
    console.log('Kozhikode Pincode Mappings:', kozhikodePincodes);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkKozhikode();
