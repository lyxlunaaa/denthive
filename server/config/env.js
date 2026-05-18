require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/denthive';

module.exports = {
  mongoUri
};

