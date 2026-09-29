const mongoose = require('mongoose');

async function connectToDatabase() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales', {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB');
}

module.exports = connectToDatabase;
