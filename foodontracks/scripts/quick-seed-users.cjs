/**
 * Quick Seed Script - Creates test users for all roles
 * Run: node scripts/quick-seed-users.cjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'RESTAURANT_OWNER', 'DELIVERY_GUY', 'CUSTOMER'],
    default: 'CUSTOMER',
    required: true 
  },
  roleLevel: { type: Number },
  phoneNumber: String,
  address: String,
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function quickSeed() {
  try {
    console.log('🌱 Starting Quick Seed for Test Users...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test users with correct role formats and email domains
    const testUsers = [
      {
        email: 'admin@admin.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'ADMIN',
        roleLevel: 4,
        phoneNumber: '+1-555-0001',
      },
      {
        email: 'restaurant@restaurant.com',
        password: 'restaurant123',
        name: 'Restaurant Owner',
        role: 'RESTAURANT_OWNER',
        roleLevel: 3,
        phoneNumber: '+1-555-0002',
      },
      {
        email: 'delivery@delivery.com',
        password: 'delivery123',
        name: 'Delivery Person',
        role: 'DELIVERY_GUY',
        roleLevel: 2,
        phoneNumber: '+1-555-0003',
      },
      {
        email: 'customer@example.com',
        password: 'customer123',
        name: 'Customer User',
        role: 'CUSTOMER',
        roleLevel: 1,
        phoneNumber: '+1-555-0004',
        address: '123 Main St, New York, NY 10001',
      },
    ];

    console.log('👥 Creating test users...\n');
    
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`ℹ️  User already exists: ${userData.email} (${userData.role})`);
          // Update password in case it changed
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.findOneAndUpdate(
            { email: userData.email },
            { password: hashedPassword, ...userData }
          );
          console.log(`✅ Updated user: ${userData.email}\n`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const user = await User.create({
            ...userData,
            password: hashedPassword,
          });
          console.log(`✅ Created user: ${user.email} (${user.role})`);
          console.log(`   Password: ${userData.password}\n`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n📋 Test Credentials Summary:\n');
    console.log('═'.repeat(60));
    console.log('ADMIN:');
    console.log('  Email: admin@admin.com');
    console.log('  Password: admin123\n');
    
    console.log('RESTAURANT OWNER:');
    console.log('  Email: restaurant@restaurant.com');
    console.log('  Password: restaurant123\n');
    
    console.log('DELIVERY PERSON:');
    console.log('  Email: delivery@delivery.com');
    console.log('  Password: delivery123\n');
    
    console.log('CUSTOMER:');
    console.log('  Email: customer@example.com');
    console.log('  Password: customer123');
    console.log('═'.repeat(60));
    
    console.log('\n✅ Quick seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

quickSeed();
