const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/denthive';
  await mongoose.connect(mongoUri);

  // WARNING: deletes users only (for local dev / scaffold repair)
  await User.deleteMany({ role: { $in: ['doctor', 'secretary', 'patient'] } });

  const doctorHash = await bcrypt.hash('Doctor123!', 10);
  const secretaryHash = await bcrypt.hash('Secretary123!', 10);

  await User.create([
    { username: 'doctor1', passwordHash: doctorHash, role: 'doctor' },
    { username: 'secretary1', passwordHash: secretaryHash, role: 'secretary' }
  ]);

  console.log('Reset & reseeded doctor1/secretary1');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

