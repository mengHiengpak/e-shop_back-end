const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
}

module.exports = connectToDatabase;
