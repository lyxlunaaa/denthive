const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    displayId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);

