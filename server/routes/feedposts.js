const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FeedPost = require('../models/FeedPost');
const Seller = require('../models/Seller');
const { protect } = require('../middleware/auth');

// @route   GET /api/feedposts
// @desc    Get all active feed posts with populated seller details
router.get('/', async (req, res) => {
  try {
    const feedPosts = await FeedPost.find({ isActive: true })
      .sort({ createdAt: -1 });

    const feedPostsWithSellers = await Promise.all(feedPosts.map(async (post) => {
      try {
        const p = post.toObject();
        if (p.sellerId) {
          let seller = await Seller.findById(p.sellerId);
          if (!seller) {
            const db = FeedPost.db;
            if (db) {
              seller = await db.collection('sellers').findOne({ 
                _id: p.sellerId instanceof mongoose.Types.ObjectId ? p.sellerId : new mongoose.Types.ObjectId(p.sellerId) 
              });
            }
          }
          if (seller) {
            p.sellerId = seller;
          }
        }
        return p;
      } catch (err) {
        console.error(`Error processing feedpost ${post._id}:`, err);
        return post.toObject();
      }
    }));

    res.json(feedPostsWithSellers);
  } catch (error) {
    console.error('Fetch feedposts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/feedposts/seller/:sellerId
// @desc    Get feed posts by seller ID
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const posts = await FeedPost.find({ 
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Fetch seller feedposts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/feedposts
// @desc    Create a new feed post
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, imageUrl, discountPercent, offerCode, sellerId } = req.body;
    
    const post = await FeedPost.create({
      sellerId: sellerId || req.user._id,
      title,
      description,
      imageUrl,
      discountPercent,
      offerCode,
      isActive: true
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
