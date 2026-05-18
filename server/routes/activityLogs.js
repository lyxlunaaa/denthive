const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth(['doctor', 'secretary']), async (req, res) => {
  const items = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ logs: items });
});

module.exports = router;

