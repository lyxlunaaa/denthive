require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const { mongoUri } = require('./config/env');
const { seedIfEmpty } = require('./services/seed');

const { attachCurrentUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const queueRoutes = require('./routes/queues');
const consultationRoutes = require('./routes/consultations');
const recordRoutes = require('./routes/dentalRecords');
const activityRoutes = require('./routes/activityLogs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Attach current user (optional) for templates that might use it
app.use(attachCurrentUser);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/dental-records', recordRoutes);
app.use('/api/activity-logs', activityRoutes);

async function start() {
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || undefined
  });

  // Ensure seed runs reliably
  await seedIfEmpty();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`DentHive running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

