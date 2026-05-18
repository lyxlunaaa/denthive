const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },

    entityType: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },

    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);

