const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Patient = require('../models/Patient');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Secretary registers new patient
router.post('/', requireAuth(['secretary']), async (req, res) => {
  try {
    const { fullName, phone, email, displayId } = req.body || {};
    if (!fullName || !String(fullName).trim()) return res.status(400).json({ error: 'fullName required' });
    if (!displayId || !String(displayId).trim()) return res.status(400).json({ error: 'displayId required' });

    const existing = await Patient.findOne({ displayId: String(displayId).trim() });
    if (existing) return res.status(409).json({ error: 'Patient with this Display ID already exists' });

    // Prevent duplicate registrations in users collection (optional)
    const existingUser = await User.findOne({ role: 'patient', displayId: String(displayId).trim() });
    if (existingUser) return res.status(409).json({ error: 'Display ID already has an account' });

    const patient = await Patient.create({
      displayId: String(displayId).trim(),
      fullName: String(fullName).trim(),
      phone: phone ? String(phone).trim() : '',
      email: email ? String(email).trim() : '',
      createdByUserId: req.user.sub
    });

    // Create patient login account with temporary password
    const tempPassword = 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await User.create({
      username: `patient_${patient.displayId}`,
      passwordHash,
      role: 'patient',
      displayId: patient.displayId
    });

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: patient._id,
      meta: { displayId: patient.displayId, fullName: patient.fullName }
    });

    return res.status(201).json({ patient, tempPassword });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth(['secretary']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const { fullName, phone, email } = req.body || {};

    const patient = await Patient.findByIdAndUpdate(
      id,
      {
        ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(email !== undefined ? { email: String(email).trim() } : {})
      },
      { new: true }
    ).lean();

    if (!patient) return res.status(404).json({ error: 'Not found' });

    await ActivityLog.create({
      actorUserId: req.user.sub,
      action: 'PATIENT_UPDATED',
      entityType: 'Patient',
      entityId: patient._id
    });

    return res.json({ patient });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';

    let filter = {};
    if (q) {
      filter = {
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { displayId: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        ]
      };
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ displayId: String(req.query.displayId || '').trim() }).lean();
      // If client didn't pass displayId, attempt lookup by linked user record
      // (We keep it simple in this scaffold.)
      if (patient) return res.json({ patients: [patient] });
      return res.json({ patients: [] });
    }

    const patients = await Patient.find(filter).limit(50).sort({ createdAt: -1 }).lean();
    return res.json({ patients });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const patient = await Patient.findById(id).lean();
    if (!patient) return res.status(404).json({ error: 'Not found' });
    return res.json({ patient });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

