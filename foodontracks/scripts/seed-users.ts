/**
 * Database Seeding Script
 * Creates test users for development and testing
 * 
 * Run: npx tsx scripts/seed-users.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import bcrypt from 'bcrypt';
import dbConnect from '../src/lib/mongodb';
import { User, UserRole, ROLE_LEVELS } from '../src/models/User';
import { Restaurant } from '../src/models/Restaurant';
import { DeliveryAgent } from '../src/models/DeliveryAgent';

async function seedUsers() {
  try {
    console.log('🌱 Starting database seeding...');
    await dbConnect();

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Restaurant.deleteMany({});
    // await DeliveryAgent.deleteMany({});
    // console.log('✅ Cleared existing data');

    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@foodontracks.com',
        password: 'Admin@123',
        role: UserRole.ADMIN,
        phoneNumber: '9999999999',
      },
      {
        name: 'Restaurant Owner',
        email: 'restaurant@test.com',
        password: 'Restaurant@123',
        role: UserRole.RESTAURANT_OWNER,
        phoneNumber: '8888888888',
      },
      {
        name: 'Delivery Guy',
        email: 'delivery@test.com',
        password: 'Delivery@123',
        role: UserRole.DELIVERY_GUY,
        phoneNumber: '7777777777',
      },
      {
        name: 'Customer User',
        email: 'customer@test.com',
        password: 'Customer@123',
        role: UserRole.CUSTOMER,
        phoneNumber: '6666666666',
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        roleLevel: ROLE_LEVELS[userData.role],
        phoneNumber: userData.phoneNumber,
        isActive: true,
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);

      // Auto-create restaurant for RESTAURANT_OWNER
      if (userData.role === UserRole.RESTAURANT_OWNER) {
        const restaurant = await Restaurant.create({
          name: `${userData.name}'s Restaurant`,
          description: 'A wonderful dining experience awaits you!',
          address: '123 Food Street, Tasty Town, TT 12345',
          phoneNumber: userData.phoneNumber,
          email: userData.email,
          ownerId: user._id,
          cuisine: ['Indian', 'Chinese', 'Continental'],
          isActive: true,
          rating: 4.5,
          totalReviews: 10,
        });

        // Update user with restaurantId
        user.restaurantId = restaurant._id;
        await user.save();

        console.log(`   └─ Created restaurant: ${restaurant.name}`);
      }

      // Auto-create delivery agent profile for DELIVERY_GUY
      if (userData.role === UserRole.DELIVERY_GUY) {
        await DeliveryAgent.create({
          userId: user._id,
          vehicleType: 'BIKE',
          isAvailable: true,
          isVerified: true,
          isActive: true,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          cancelledDeliveries: 0,
          averageRating: 0,
          joinedAt: new Date(),
        });

        console.log(`   └─ Created delivery agent profile`);
      }
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach(user => {
      console.log(`${user.role.padEnd(20)} | ${user.email.padEnd(30)} | ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedUsers();
