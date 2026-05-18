const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function seedOnce() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/denthive';
  await mongoose.connect(mongoUri);

  const count = await User.estimatedDocumentCount();
  console.log('User count before seed:', count);

  if (count === 0) {
    const doctorPassword = 'Doctor123!';
    const secretaryPassword = 'Secretary123!';

    const doctorHash = await bcrypt.hash(doctorPassword, 10);
    const secretaryHash = await bcrypt.hash(secretaryPassword, 10);

    await User.create([
      { username: 'doctor1', passwordHash: doctorHash, role: 'doctor' },
      { username: 'secretary1', passwordHash: secretaryHash, role: 'secretary' }
    ]);
    console.log('Seeded doctor1/secretary1');
  }

  const doctor = await User.findOne({ role: 'doctor', username: 'doctor1' }).lean();
  console.log('Doctor doc after seed:', doctor ? { _id: doctor._id, username: doctor.username, role: doctor.role } : null);

  await mongoose.disconnect();
}

seedOnce().catch((e) => {
  console.error(e);
  process.exit(1);
});

