const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPEG, PNG, WEBP) and PDFs are allowed!'));
    }
});

// @route   POST api/upload
// @desc    Upload an image or PDF
// @access  Private (for verification/profile) or Public (depending on use)
// Here we make it optionally public for registration, but usually private is better
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        res.json({
            message: 'File uploaded successfully',
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            mimetype: req.file.mimetype
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
