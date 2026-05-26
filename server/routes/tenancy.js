const express = require('express');
const mongoose = require('mongoose');
const sendEmail = require('../utils/email');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');

// Helper to get central DB connection
const getCentralDb = () => mongoose.connection.useDb('zudo-central', { useCache: true });

// @route   POST /api/tenancy/request-service
// @desc    Store a request for service expansion in an unsupported pincode
router.post('/request-service', async (req, res) => {
  try {
    const { name, email, pincode, city, mobile } = req.body;
    const centralDb = getCentralDb();
    
    // 1. Store in Database
    const ServiceReqModel = centralDb.models.ServiceRequest || centralDb.model('ServiceRequest', ServiceRequest.schema);
    const newRequest = new ServiceReqModel({ name, email, pincode, city, mobile });
    await newRequest.save();

    // 2. Notify Admin via Email
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `New Service Request for Pincode: ${pincode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669;">New Store Request</h2>
          <p>A user has requested Zudo service in an unsupported area.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile No:</strong> ${mobile || 'Not provided'}</p>
            <p><strong>Pincode:</strong> ${pincode}</p>
            <p><strong>City:</strong> ${city || 'Not provided'}</p>
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">Requested at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    // 3. Confirm to User via Email
    await sendEmail({
      to: email,
      subject: 'Zudo: We received your request!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669;">Hello ${name}!</h2>
          <p>Thank you for your interest in Zudo. We've received your request for delivery in pincode <strong>${pincode}</strong>.</p>
          <p>Our team is constantly expanding to new areas, and we've added your location to our priority list.</p>
          <p>We will email you as soon as we launch in your neighborhood!</p>
          <br/>
          <p>Best regards,<br/><strong>Team Zudo</strong></p>
        </div>
      `
    });
    
    res.json({ message: 'Request submitted successfully!' });
  } catch (err) {
    console.error('[DEBUG] Error storing service request or sending email:', err);
    res.status(500).json({ message: 'Error submitting request' });
  }
});

// @route   GET /api/tenancy/locations
// @desc    Get all active cities and their dbNames from zudo-central
router.get('/locations', async (req, res) => {
  try {
    const centralDb = getCentralDb();
    const locations = await centralDb.collection('locations').find({}).toArray();
    res.json(locations);
  } catch (err) {
    console.error('[DEBUG] Error fetching central locations:', err);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});

// @route   GET /api/tenancy/find/:pincode
// @desc    Find database by pincode from zudo-central
router.get('/find/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const centralDb = getCentralDb();

    let mapping = await centralDb.collection('pincodemappings').findOne({ pincode });
    if (!mapping) {
      mapping = await centralDb.collection('pincodes').findOne({ pincode });
    }
    
    if (mapping) {
      const location = await centralDb.collection('locations').findOne({ city: mapping.city });
      if (location) {
        return res.json({
          ...location,
          dbName: location.dbName || location.name || mapping.dbName || `zudo-${mapping.city.toLowerCase()}`
        });
      }
      return res.json({ 
        dbName: mapping.dbName || `zudo-${mapping.city.toLowerCase()}`, 
        city: mapping.city,
        pincode: pincode
      });
    }
    
    res.status(404).json({ message: 'Sorry, we are not available in this location yet.' });
  } catch (err) {
    console.error('[CRITICAL] Error finding location by pincode:', err);
    res.status(500).json({ message: 'Internal Database Error', error: err.message });
  }
});

module.exports = router;
