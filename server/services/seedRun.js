const mongoose = require('mongoose');
const { seedIfEmpty } = require('./seed');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/denthive');
  await seedIfEmpty();
  const User = require('../models/User');
  const docs = await User.find({ role: { $in: ['doctor', 'secretary'] } }).select('username role').lean();
  console.log('After seed:', docs);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

