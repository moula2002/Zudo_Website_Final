const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const storage = require('../utils/context');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
  name: { type: String, required: true }
}, { timestamps: true });

adminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = new Proxy(function() {}, {
  get(target, prop) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Admin'] || conn.model('Admin', adminSchema);
    const value = model[prop];
    return typeof value === 'function' ? value.bind(model) : value;
  },
  construct(target, args) {
    const context = storage.getStore();
    const conn = context?.db || mongoose.connection;
    const model = conn.models['Admin'] || conn.model('Admin', adminSchema);
    return new model(...args);
  }
});
