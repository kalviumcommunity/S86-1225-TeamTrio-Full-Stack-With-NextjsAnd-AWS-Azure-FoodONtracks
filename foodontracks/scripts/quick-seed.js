/**
 * Quick Seed Script - Add Restaurant & Menu Items
 * Run: node scripts/quick-seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'restaurant_owner', 'delivery_person'], default: 'customer' },
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
  rating: { type: Number, default: 4.5 },
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

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
const Address = mongoose.models.Address || mongoose.model('Address', AddressSchema);

async function quickSeed() {
  try {
    console.log('🌱 Starting Quick Seed...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check and create restaurant owner
    console.log('👨‍🍳 Creating/Finding restaurant owner...');
    let owner = await User.findOne({ email: 'owner@burgerhouse.com' });
    if (!owner) {
      const ownerPassword = await bcrypt.hash('owner123', 10);
      owner = await User.create({
        email: 'owner@burgerhouse.com',
        password: ownerPassword,
        name: 'John Burger',
        role: 'restaurant_owner',
        phoneNumber: '+1-555-1234',
        address: '123 Main St, New York, NY 10001',
      });
      console.log(`✅ Created owner: ${owner.email}`);
    } else {
      console.log(`✅ Found existing owner: ${owner.email}`);
    }
    
    // Check and create customer
    console.log('👤 Creating/Finding customer...');
    let customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      const customerPassword = await bcrypt.hash('customer123', 10);
      customer = await User.create({
        email: 'customer@test.com',
        password: customerPassword,
        name: 'Jane Customer',
        role: 'customer',
        phoneNumber: '+1-555-5678',
        address: '456 Oak Ave, New York, NY 10002',
      });
      console.log(`✅ Created customer: ${customer.email}`);
    } else {
      console.log(`✅ Found existing customer: ${customer.email}`);
    }
    
    // Check and create customer address
    console.log('📍 Creating/Finding customer address...');
    let address = await Address.findOne({ userId: customer._id });
    if (!address) {
      address = await Address.create({
        userId: customer._id,
        addressLine1: '456 Oak Ave',
        addressLine2: 'Apt 5B',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        country: 'USA',
        addressType: 'home',
        isDefault: true,
      });
      console.log(`✅ Created address for customer`);
    } else {
      console.log(`✅ Found existing address for customer`);
    }
    console.log();
    
    // Check and create restaurant
    console.log('🍔 Creating/Finding restaurant...');
    let restaurant = await Restaurant.findOne({ email: 'info@burgerhouse.com' });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'The Burger House',
        description: 'Premium gourmet burgers made with fresh, locally sourced ingredients. Home of the best burgers in town!',
        address: '789 Food Street, New York, NY 10003',
        phoneNumber: '+1-555-BURGER',
        email: 'info@burgerhouse.com',
        ownerId: owner._id,
        imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
        cuisine: ['American', 'Burgers', 'Fast Food'],
        rating: 4.7,
        isActive: true,
      });
      console.log(`✅ Created restaurant: ${restaurant.name}`);
    } else {
      console.log(`✅ Found existing restaurant: ${restaurant.name}`);
    }
    
    // Check and create menu items
    console.log('🍕 Creating/Finding menu items...');
    const existingItems = await MenuItem.find({ restaurantId: restaurant._id });
    
    if (existingItems.length === 0) {
      const menuItems = await MenuItem.insertMany([
        {
          restaurantId: restaurant._id,
          name: 'Classic Cheeseburger',
          description: 'Juicy beef patty with melted cheddar, lettuce, tomato, pickles, and our special sauce on a toasted bun',
          price: 12.99,
          category: 'Burgers',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
        },
        {
          restaurantId: restaurant._id,
          name: 'Crispy Chicken Burger',
          description: 'Crispy fried chicken breast with coleslaw, spicy mayo, and pickles on a brioche bun',
          price: 13.99,
          category: 'Burgers',
          imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
        },
        {
          restaurantId: restaurant._id,
          name: 'Loaded Cheese Fries',
          description: 'Golden crispy fries topped with melted cheese, bacon bits, jalapeños, and ranch dressing',
          price: 8.99,
          category: 'Sides',
          imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
        },
      ]);
      console.log(`✅ Created ${menuItems.length} menu items\n`);
    } else {
      console.log(`✅ Found ${existingItems.length} existing menu items\n`);
    }
    
    // Get all menu items for display
    const allMenuItems = await MenuItem.find({ restaurantId: restaurant._id });
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ SEED COMPLETED SUCCESSFULLY! ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   👥 Users: 2`);
    console.log(`   🍔 Restaurants: 1`);
    console.log(`   🍕 Menu Items: ${allMenuItems.length}`);
    console.log(`   📍 Addresses: 1\n`);
    
    console.log('🔐 Test Credentials:');
    console.log('   Restaurant Owner:');
    console.log('   📧 Email: owner@burgerhouse.com');
    console.log('   🔑 Password: owner123\n');
    console.log('   Customer:');
    console.log('   📧 Email: customer@test.com');
    console.log('   🔑 Password: customer123\n');
    
    console.log('🍔 Restaurant:');
    console.log(`   Name: ${restaurant.name}`);
    console.log(`   ID: ${restaurant._id}\n`);
    
    console.log('🍕 Menu Items:');
    allMenuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - $${item.price}`);
    });
    console.log('\n✅ Ready to test!\n');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

quickSeed();
