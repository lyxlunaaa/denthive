const bcrypt = require('bcrypt');
const User = require('../models/User');

async function seedIfEmpty() {
  // Seed doctor/secretary independently so partial existing data still works.
  const existing = await User.find({ role: { $in: ['doctor', 'secretary'] } }).select('username role').lean();
  const haveDoctor = existing.some((u) => u.role === 'doctor' && u.username === 'doctor1');
  const haveSecretary = existing.some((u) => u.role === 'secretary' && u.username === 'secretary1');

  const ops = [];

  if (!haveDoctor) {
    const doctorPassword = 'Doctor123!';
    const doctorHash = await bcrypt.hash(doctorPassword, 10);
    ops.push(
      User.create({
        username: 'doctor1',
        passwordHash: doctorHash,
        role: 'doctor'
      })
    );
  }

  if (!haveSecretary) {
    const secretaryPassword = 'Secretary123!';
    const secretaryHash = await bcrypt.hash(secretaryPassword, 10);
    ops.push(
      User.create({
        username: 'secretary1',
        passwordHash: secretaryHash,
        role: 'secretary'
      })
    );
  }

  if (ops.length) await Promise.all(ops);
}

module.exports = { seedIfEmpty };

