const mongoose = require("mongoose");
require('dotenv').config({ path: 'config.env' });

const Customer = require('../models/customer.models');

async function fixWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales');
    console.log('Connected to MongoDB');

    // Convert legacy array wallets (never written to) into a numeric balance
    const result = await Customer.updateMany(
      { wallet: { $type: "array" } },
      [{ $set: { wallet: 0 } }]
    );

    console.log(`Fixed ${result.modifiedCount} customers with array wallets.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixWallet();
