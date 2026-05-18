const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { signToken, requireAuth } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { role, username, password, displayId } = req.body || {};

    if (!role || !['doctor', 'secretary', 'patient'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let user;

    if (role === 'patient') {
      const missing = requireFields(['displayId', 'password'], req.body);
      if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

      user = await User.findOne({ role: 'patient', displayId: String(displayId).trim() });
    } else {
      const missing = requireFields(['username', 'password'], req.body);
      if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

      user = await User.findOne({ role, username: String(username).trim() });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);

    await ActivityLog.create({
      actorUserId: user._id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user._id
    });

    // If patient, also include patient profile
    let patientProfile = null;
    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ displayId: user.displayId }).lean();
    }

    return res.json({ token, role: user.role, user: { id: user._id, username: user.username, displayId: user.displayId }, patientProfile });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Secretaries create staff/patients in other endpoints; we keep auth minimal.
router.get('/me', requireAuth(['doctor', 'secretary', 'patient']), async (req, res) => {
  const user = await User.findById(req.user.sub).select('role username displayId').lean();
  return res.json({ user });
});

module.exports = router;

