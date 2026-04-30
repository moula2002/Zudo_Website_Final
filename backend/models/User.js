const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'business'], default: 'user' },
    profileImage: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    businessDocument: { type: String, default: '' }, // URL to PDF
    isVerified: { type: Boolean, default: false },   // Admin verification status
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
