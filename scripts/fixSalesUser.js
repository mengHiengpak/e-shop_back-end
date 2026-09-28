const mongoose = require("mongoose");
require('dotenv').config({ path: 'config.env' });

const Sale = require('../models/sales.models');
const Users = require('../models/user.models');
const Customer = require('../models/customer.models');

async function fixSales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-management');
    console.log('Connected to MongoDB');

    // Find a valid user to assign (prefer super/admin)
    const admin = await Users.findOne({ role: { $in: ['super', 'admin'] } }).exec();
    if (!admin) {
      console.log('No admin/super user found. Cannot fix sales.user.');
      process.exit(1);
    }
    console.log(`Using user: ${admin._id} (${admin.username}, ${admin.role})`);

    const sales = await Sale.find({}).exec();
    console.log(`Found ${sales.length} sales`);

    for (const sale of sales) {
      // Check if current user ref points to a real user
      if (sale.user) {
        const existingUser = await Users.findById(sale.user).exec();
        if (existingUser) {
          // If user field is valid, but is same as customer id (customer collection), fix anyway
          const isCustomer = await Customer.findById(sale.user).exec();
          if (!isCustomer) {
            continue; // valid user, skip
          }
        }
      }
      // user is null OR points to a customer record -> fix
      sale.user = admin._id;
      await sale.save();
      console.log(`Fixed sale ${sale.invoiceNumber} -> user ${admin.username}`);
    }

    console.log('Done fixing sales.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixSales();