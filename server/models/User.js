const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['doctor', 'secretary', 'patient'] },

    // Patient display ID is used for patient portal login
    displayId: { type: String, unique: true, sparse: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

