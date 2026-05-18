const express = require('express');
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

router.post('/enqueue', requireAuth(['secretary']), async (req, res) => {
  try {
    const { patientId } = req.body || {};
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ error: 'Valid patientId required' });

    const queueDate = todayKey();

    const patient = await Patient.findById(patientId).lean();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Prevent duplicate enqueues per day
    const already = await Queue.findOne({ patientId, queueDate, status: { $in: ['Waiting', 'In Progress'] } });
    if (already) return res.status(409).json({ error: 'Patient already in active queue' });

    // Find next queue number
    const last = await Queue.findOne({ queueDate }).sort({ queueNumber: -1 }).lean();
    const nextNumber = (last?.queueNumber || 0) + 1;

    const q = await Queue.create({
      patientId,
      queueNumber: nextNumber,
      status: 'Waiting',
      assignedDoctorId: null,
      queueDate
    });

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'QUEUE_ENQUEUED',
      entityType: 'Queue',
      entityId: q._id,
      meta: { patientId, queueNumber: nextNumber }
    });

    return res.status(201).json({ queue: q });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/status', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  try {
    const queueDate = todayKey();

    const [waiting, inProgress, completed] = await Promise.all([
      Queue.find({ queueDate, status: 'Waiting' }).populate('patientId', 'displayId fullName phone').sort({ queueNumber: 1 }).lean(),
      Queue.find({ queueDate, status: 'In Progress' }).populate('patientId', 'displayId fullName phone').sort({ queueNumber: 1 }).lean(),
      Queue.find({ queueDate, status: 'Completed' }).populate('patientId', 'displayId fullName phone').sort({ queueNumber: 1 }).lean()
    ]);

    // For patient, filter to their queue entry if possible
    if (req.user.role === 'patient') {
      // Use displayId passed by client in query for this scaffold
      const displayId = req.query.displayId ? String(req.query.displayId).trim() : '';
      if (!displayId) return res.json({ waiting: [], inProgress: [], completed: [], etaMins: null });

      const my = await Queue.findOne({ queueDate, status: { $in: ['Waiting', 'In Progress', 'Completed'] } })
        .populate('patientId', 'displayId')
        .lean();

      // The above finds first doc; for accuracy, do extra query:
      const myQueue = await Queue.find({ queueDate })
        .populate('patientId', 'displayId')
        .lean();

      const mine = myQueue.filter((x) => x.patientId?.displayId === displayId);
      const myEntry = mine[0] || null;

      const myWaitingCount = waiting.filter((x) => x.patientId?.displayId !== displayId).length;
      const etaMins = myEntry?.status === 'Waiting' ? myWaitingCount * 5 : 0;

      return res.json({
        waiting: myEntry?.status === 'Waiting' ? waiting : [],
        inProgress: myEntry?.status === 'In Progress' ? inProgress : [],
        completed: myEntry?.status === 'Completed' ? completed : [],
        etaMins
      });
    }

    return res.json({ waiting, inProgress, completed });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:queueId/status', requireAuth(['doctor', 'secretary']), async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(queueId)) return res.status(400).json({ error: 'Invalid queueId' });
    if (!['Waiting', 'In Progress', 'Completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const q = await Queue.findById(queueId);
    if (!q) return res.status(404).json({ error: 'Queue entry not found' });

    q.status = status;
    if (req.user.role === 'doctor' && status === 'In Progress') q.assignedDoctorId = req.user.sub;
    if (status === 'Completed') q.assignedDoctorId = q.assignedDoctorId;

    await q.save();

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'QUEUE_STATUS_UPDATED',
      entityType: 'Queue',
      entityId: q._id,
      meta: { status }
    });

    return res.json({ queue: q });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

