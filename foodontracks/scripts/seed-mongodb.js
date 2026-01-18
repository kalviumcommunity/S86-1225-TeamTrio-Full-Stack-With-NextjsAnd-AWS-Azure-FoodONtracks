/**
 * MongoDB Seed Script
 * 
 * Seeds the MongoDB database with initial data
 * Run: node scripts/seed-mongodb.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Mongoose schemas (inline for seed script)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'restaurant_owner'], default: 'user' },
  phoneNumber: String,
  address: String,
}, { timestamps: true });

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: String,
  imagePublicId: String,
  cuisine: [String],
  rating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const MenuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: String,
  imagePublicId: String,
  isAvailable: { type: Boolean, default: true },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
}, { timestamps: true });

// Register models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);

async function seed() {
  try {
    console.log('🌱 Starting MongoDB seed...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('✅ Cleared existing data\n');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@foodontracks.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      phoneNumber: '+1-555-0001',
    });
    console.log(`✅ Created admin: ${admin.email}\n`);
    
    // Create restaurant owner
    console.log('👨‍🍳 Creating restaurant owner...');
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const owner = await User.create({
      email: 'owner@pizzapalace.com',
      password: ownerPassword,
      name: 'Pizza Palace Owner',
      role: 'restaurant_owner',
      phoneNumber: '+1-555-0002',
    });
    console.log(`✅ Created restaurant owner: ${owner.email}\n`);
    
    // Create regular users
    console.log('👥 Creating regular users...');
    const userPassword = await bcrypt.hash('user123', 10);
    const user1 = await User.create({
      email: 'john@example.com',
      password: userPassword,
      name: 'John Doe',
      role: 'user',
      phoneNumber: '+1-555-0100',
      address: '123 Main St, New York, NY 10001',
    });
    
    const user2 = await User.create({
      email: 'jane@example.com',
      password: userPassword,
      name: 'Jane Smith',
      role: 'user',
      phoneNumber: '+1-555-0101',
      address: '456 Oak Ave, Los Angeles, CA 90001',
    });
    console.log(`✅ Created users: ${user1.email}, ${user2.email}\n`);
    
    // Create restaurants
    console.log('🏪 Creating restaurants...');
    const restaurant1 = await Restaurant.create({
      name: 'Pizza Palace',
      description: 'Authentic Italian pizza made with fresh ingredients and traditional recipes.',
      address: '789 Broadway, New York, NY 10003',
      phoneNumber: '+1-555-1000',
      email: 'info@pizzapalace.com',
      ownerId: owner._id,
      cuisine: ['Italian', 'Pizza'],
      rating: 4.5,
      isActive: true,
    });
    
    const restaurant2 = await Restaurant.create({
      name: 'Burger Hub',
      description: 'Gourmet burgers and craft beers in a casual atmosphere.',
      address: '321 5th Avenue, New York, NY 10016',
      phoneNumber: '+1-555-1001',
      email: 'info@burgerhub.com',
      ownerId: owner._id,
      cuisine: ['American', 'Burgers'],
      rating: 4.2,
      isActive: true,
    });
    
    const restaurant3 = await Restaurant.create({
      name: 'Sushi Master',
      description: 'Fresh sushi and Japanese cuisine prepared by master chefs.',
      address: '555 Park Ave, New York, NY 10022',
      phoneNumber: '+1-555-1002',
      email: 'info@sushimaster.com',
      ownerId: owner._id,
      cuisine: ['Japanese', 'Sushi'],
      rating: 4.8,
      isActive: true,
    });
    console.log(`✅ Created restaurants: ${restaurant1.name}, ${restaurant2.name}, ${restaurant3.name}\n`);
    
    // Create menu items for Pizza Palace
    console.log('🍕 Creating menu items...');
    await MenuItem.create([
      {
        restaurantId: restaurant1._id,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 12.99,
        category: 'Pizza',
        isAvailable: true,
        isVegetarian: true,
      },
      {
        restaurantId: restaurant1._id,
        name: 'Pepperoni Pizza',
        description: 'Loaded with pepperoni and extra cheese',
        price: 14.99,
        category: 'Pizza',
        isAvailable: true,
      },
      {
        restaurantId: restaurant1._id,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 8.99,
        category: 'Salad',
        isAvailable: true,
        isVegetarian: true,
      },
    ]);
    
    // Create menu items for Burger Hub
    await MenuItem.create([
      {
        restaurantId: restaurant2._id,
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato',
        price: 11.99,
        category: 'Burgers',
        isAvailable: true,
      },
      {
        restaurantId: restaurant2._id,
        name: 'Veggie Burger',
        description: 'Plant-based patty with avocado and special sauce',
        price: 10.99,
        category: 'Burgers',
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
      },
      {
        restaurantId: restaurant2._id,
        name: 'French Fries',
        description: 'Crispy golden fries with sea salt',
        price: 4.99,
        category: 'Sides',
        isAvailable: true,
        isVegetarian: true,
      },
    ]);
    
    // Create menu items for Sushi Master
    await MenuItem.create([
      {
        restaurantId: restaurant3._id,
        name: 'California Roll',
        description: 'Crab, avocado, and cucumber wrapped in rice and nori',
        price: 9.99,
        category: 'Sushi',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3._id,
        name: 'Salmon Nigiri',
        description: 'Fresh salmon over sushi rice (2 pieces)',
        price: 6.99,
        category: 'Sushi',
        isAvailable: true,
      },
      {
        restaurantId: restaurant3._id,
        name: 'Vegetable Tempura',
        description: 'Assorted vegetables in light, crispy batter',
        price: 8.99,
        category: 'Appetizers',
        isAvailable: true,
        isVegetarian: true,
      },
    ]);
    console.log('✅ Created menu items\n');
    
    // Summary
    const userCount = await User.countDocuments();
    const restaurantCount = await Restaurant.countDocuments();
    const menuItemCount = await MenuItem.countDocuments();
    
    console.log('✨ Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Restaurants: ${restaurantCount}`);
    console.log(`   Menu Items: ${menuItemCount}\n`);
    
    console.log('🔐 Test Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@foodontracks.com');
    console.log('     Password: admin123\n');
    console.log('   Restaurant Owner:');
    console.log('     Email: owner@pizzapalace.com');
    console.log('     Password: owner123\n');
    console.log('   Customer:');
    console.log('     Email: john@example.com');
    console.log('     Password: user123\n');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run seed
seed();
