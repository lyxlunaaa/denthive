const express = require('express');
const mongoose = require('mongoose');
const DentalRecord = require('../models/DentalRecord');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Doctor updates patient dental record (creates a new record entry)
router.post('/', requireAuth(['doctor']), async (req, res) => {
  try {
    const {
      patientId,
      procedureNotes,
      findings,
      prescriptions,
      followUpRecommendations,
      diagnoses,
      treatmentProcedures
    } = req.body || {};

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ error: 'Valid patientId required' });

    const record = await DentalRecord.create({
      patientId,
      procedureNotes: procedureNotes ? String(procedureNotes) : '',
      findings: findings ? String(findings) : '',
      prescriptions: prescriptions ? String(prescriptions) : '',
      followUpRecommendations: followUpRecommendations ? String(followUpRecommendations) : '',
      diagnoses: Array.isArray(diagnoses) ? diagnoses.map(String).filter(Boolean) : [],
      treatmentProcedures: Array.isArray(treatmentProcedures) ? treatmentProcedures.map(String).filter(Boolean) : []
    });

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'DENTAL_RECORD_ADDED',
      entityType: 'DentalRecord',
      entityId: record._id,
      meta: { patientId: record.patientId }
    });

    return res.status(201).json({ dentalRecord: record });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/patient/:patientId', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ error: 'Invalid patientId' });

    const records = await DentalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

