const express = require('express');
const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Queue = require('../models/Queue');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Doctor adds notes and starts/continues consultation for a queue item
router.post('/', requireAuth(['doctor']), async (req, res) => {
  try {
    const { patientId, queueId, notes } = req.body || {};
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ error: 'Valid patientId required' });
    if (queueId && !mongoose.Types.ObjectId.isValid(queueId)) return res.status(400).json({ error: 'Invalid queueId' });

    if (queueId) {
      const q = await Queue.findById(queueId);
      if (!q) return res.status(404).json({ error: 'Queue not found' });
    }

    const c = await Consultation.create({
      patientId,
      queueId: queueId || null,
      doctorId: req.user.sub,
      notes: notes ? String(notes).trim() : ''
    });

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'CONSULTATION_NOTE_ADDED',
      entityType: 'Consultation',
      entityId: c._id
    });

    return res.status(201).json({ consultation: c });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/patient/:patientId', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ error: 'Invalid patientId' });

    const items = await Consultation.find({ patientId }).sort({ createdAt: -1 }).lean();
    return res.json({ consultations: items });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

