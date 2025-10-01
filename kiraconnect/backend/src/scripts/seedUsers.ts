import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiraconnect';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing users (optional, but requested 100 users, so let's just add them)
    // await User.deleteMany({ email: /seed_/ });

    const users = [];
    
    // Generate 50 Tenants (Renters)
    for (let i = 1; i <= 50; i++) {
      users.push({
        name: `Tenant ${i}`,
        email: `tenant${i}@example.com`,
        phone: `+2519110000${i.toString().padStart(2, '0')}`,
        password: 'password123',
        role: 'tenant',
        city: 'Addis Ababa',
        isVerified: true
      });
    }

    // Generate 50 Landlords
    for (let i = 1; i <= 50; i++) {
      users.push({
        name: `Landlord ${i}`,
        email: `landlord${i}@example.com`,
        phone: `+2519220000${i.toString().padStart(2, '0')}`,
        password: 'password123',
        role: 'landlord',
        city: 'Addis Ababa',
        isVerified: true
      });
    }

    console.log(`Starting to insert ${users.length} users...`);
    
    // We use a loop or insertMany. Since we have a pre-save hook for hashing, 
    // insertMany might not trigger it unless configured, but Mongoose usually handles it.
    // However, to be safe with pre-save hooks, we can create them one by one or use create().
    
    await User.create(users);

    console.log('Successfully seeded 100 users!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
