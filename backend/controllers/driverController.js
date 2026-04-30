const Driver = require('../models/Driver');

exports.getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createDriver = async (req, res) => {
    try {
        const driver = new Driver(req.body);
        await driver.save();
        res.status(201).json(driver);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateDriverStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const driver = await Driver.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
