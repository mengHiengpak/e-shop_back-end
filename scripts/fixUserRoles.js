const mongoose = require("mongoose");
require('dotenv').config({ path: 'config.env' });

const Users = require('../models/user.models');

const VALID_ROLES = ['super', 'admin', 'cashier'];

async function fixRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-management');
    console.log('Connected to MongoDB');

    const users = await Users.find({}).select('username email role').exec();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const cleaned = typeof user.role === 'string' ? user.role.trim().toLowerCase() : user.role;
      const isClean = VALID_ROLES.includes(cleaned);

      if (!isClean) {
        console.log(`  ${user.username}: role "${user.role}" is not one of ${VALID_ROLES.join(', ')} - left untouched`);
        continue;
      }

      if (user.role === cleaned) {
        console.log(`  ${user.username}: role "${user.role}" already clean`);
        continue;
      }

      const before = user.role;
      user.role = cleaned;
      await user.save();
      console.log(`  ${user.username}: role ${JSON.stringify(before)} -> ${JSON.stringify(cleaned)}`);
    }

    console.log('Done fixing user roles.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixRoles();
