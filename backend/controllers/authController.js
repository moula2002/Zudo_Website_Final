const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, businessDocument } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ 
          name, 
          email, 
          password: hashedPassword,
          role: role || 'user',
          businessDocument: businessDocument || ''
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.status(201).json({ 
          token, 
          user: { 
            id: user._id, 
            name, 
            email, 
            role: user.role,
            isVerified: user.isVerified 
          } 
        });
    } catch (err) {
        console.error('Registration error details:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        res.status(500).json({ 
            message: 'Server error during registration',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ 
          token, 
          user: { 
            id: user._id, 
            name: user.name, 
            email,
            role: user.role,
            isVerified: user.isVerified,
            businessDocument: user.businessDocument
          } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updateData = {};
        const allowedFields = ['name', 'phone', 'address', 'profileImage', 'businessDocument', 'isVerified'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: err.message });
    }
};
