import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import { User } from '../models/User';
import mongoose from 'mongoose';
import logger from '../utils/logger';

async function seed() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Super Admin';

  if (!email || !password) {
    logger.error('Usage: ts-node src/scripts/seedAdmin.ts <email> <password> [name]');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'superadmin';
    existing.password = password;
    await existing.save();
    logger.info(`Existing user ${email} promoted to superadmin and password reset.`);
  } else {
    await User.create({ name, email, password, role: 'superadmin' });
    logger.info(`Superadmin account created for ${email}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
