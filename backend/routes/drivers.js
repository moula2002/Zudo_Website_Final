const express = require('express');
const router = express.Router();
const { getDrivers, createDriver, updateDriverStatus } = require('../controllers/driverController');

router.get('/', getDrivers);
router.post('/', createDriver);
router.put('/:id/status', updateDriverStatus);

module.exports = router;
