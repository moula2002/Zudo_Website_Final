const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    status: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', driverSchema);
