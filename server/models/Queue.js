const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

    queueNumber: { type: Number, required: true, index: true },

    status: { type: String, required: true, enum: ['Waiting', 'In Progress', 'Completed'], default: 'Waiting' },

    // Which doctor is currently assigned / consulting
    assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Day key for orchestration
    queueDate: { type: String, required: true, index: true } // YYYY-MM-DD
  },
  { timestamps: true }
);

queueSchema.index({ queueDate: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);

