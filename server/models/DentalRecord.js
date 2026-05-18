const mongoose = require('mongoose');

const dentalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

    // Clinical documentation fields (stored per update)
    procedureNotes: { type: String, default: '' },
    findings: { type: String, default: '' },
    prescriptions: { type: String, default: '' },
    followUpRecommendations: { type: String, default: '' },

    diagnoses: [{ type: String, default: '' }],
    treatmentProcedures: [{ type: String, default: '' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('DentalRecord', dentalRecordSchema);

