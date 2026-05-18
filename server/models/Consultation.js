const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', default: null },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Consultation documentation (summarized for timeline)
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);

