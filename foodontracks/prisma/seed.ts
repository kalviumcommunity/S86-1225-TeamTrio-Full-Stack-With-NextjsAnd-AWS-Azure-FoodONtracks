import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderTracking.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.address.deleteMany();
  await prisma.deliveryPerson.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Seed Users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1234567890",
        password: hashedPassword,
        role: "CUSTOMER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phoneNumber: "+1234567891",
        password: hashedPassword,
        role: "CUSTOMER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@foodontracks.com",
        phoneNumber: "+1234567892",
        password: hashedPassword,
        role: "ADMIN",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Seed Addresses
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        userId: users[0].id,
        addressLine1: "123 Main Street",
        addressLine2: "Apt 4B",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: users[1].id,
        addressLine1: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "USA",
        isDefault: true,
      },
    }),
  ]);

  console.log(`✅ Created ${addresses.length} addresses`);

  // Seed Restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: "Pizza Palace",
        email: "contact@pizzapalace.com",
        phoneNumber: "+1555000001",
        description: "Best pizza in town with authentic Italian recipes",
        address: "789 Pizza Street",
        city: "New York",
        state: "NY",
        zipCode: "10002",
        rating: 4.5,
        isActive: true,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: "Burger Barn",
        email: "info@burgerbarn.com",
        phoneNumber: "+1555000002",
        description: "Juicy burgers made with premium ingredients",
        address: "321 Burger Lane",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90002",
        rating: 4.3,
        isActive: true,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: "Sushi Symphony",
        email: "hello@sushisymphony.com",
        phoneNumber: "+1555000003",
        description: "Fresh sushi and Japanese cuisine",
        address: "654 Sushi Avenue",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        rating: 4.8,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${restaurants.length} restaurants`);

  // Seed Menu Items
  const menuItems = await Promise.all([
    // Pizza Palace Menu
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[0].id,
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and basil",
        price: 12.99,
        category: "Pizza",
        imageUrl: "https://example.com/margherita.jpg",
        isAvailable: true,
        preparationTime: 20,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[0].id,
        name: "Pepperoni Pizza",
        description: "Loaded with pepperoni and extra cheese",
        price: 14.99,
        category: "Pizza",
        isAvailable: true,
        preparationTime: 20,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[0].id,
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with Caesar dressing",
        price: 8.99,
        category: "Salad",
        isAvailable: true,
        preparationTime: 10,
      },
    }),

    // Burger Barn Menu
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[1].id,
        name: "Classic Cheeseburger",
        description:
          "Beef patty with cheese, lettuce, tomato, and special sauce",
        price: 10.99,
        category: "Burger",
        isAvailable: true,
        preparationTime: 15,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[1].id,
        name: "Double Bacon Burger",
        description: "Two patties with crispy bacon and cheese",
        price: 15.99,
        category: "Burger",
        isAvailable: true,
        preparationTime: 18,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[1].id,
        name: "French Fries",
        description: "Crispy golden fries",
        price: 4.99,
        category: "Sides",
        isAvailable: true,
        preparationTime: 8,
      },
    }),

    // Sushi Symphony Menu
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[2].id,
        name: "California Roll",
        description: "Crab, avocado, and cucumber roll",
        price: 11.99,
        category: "Sushi",
        isAvailable: true,
        preparationTime: 15,
      },
    }),
    prisma.menuItem.create({
      data: {
        restaurantId: restaurants[2].id,
        name: "Salmon Nigiri",
        description: "Fresh salmon over rice (6 pieces)",
        price: 13.99,
        category: "Sushi",
        isAvailable: true,
        preparationTime: 12,
      },
    }),
  ]);

  console.log(`✅ Created ${menuItems.length} menu items`);

  // Seed Delivery Persons
  const deliveryPersons = await Promise.all([
    prisma.deliveryPerson.create({
      data: {
        name: "Mike Delivery",
        email: "mike.delivery@foodontracks.com",
        phoneNumber: "+1555100001",
        vehicleType: "Motorcycle",
        vehicleNumber: "NYC-1234",
        isAvailable: true,
        rating: 4.7,
      },
    }),
    prisma.deliveryPerson.create({
      data: {
        name: "Sarah Express",
        email: "sarah.express@foodontracks.com",
        phoneNumber: "+1555100002",
        vehicleType: "Car",
        vehicleNumber: "LA-5678",
        isAvailable: false,
        rating: 4.9,
      },
    }),
  ]);

  console.log(`✅ Created ${deliveryPersons.length} delivery persons`);

  // Seed Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: users[0].id,
        restaurantId: restaurants[0].id,
        addressId: addresses[0].id,
        deliveryPersonId: deliveryPersons[0].id,
        orderNumber: `ORD-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        status: "DELIVERED",
        totalAmount: 26.97,
        deliveryFee: 3.99,
        tax: 2.16,
        discount: 0,
        specialInstructions: "Please ring the doorbell",
        estimatedDeliveryTime: new Date(Date.now() - 3600000), // 1 hour ago
        actualDeliveryTime: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    }),
    prisma.order.create({
      data: {
        userId: users[1].id,
        restaurantId: restaurants[1].id,
        addressId: addresses[1].id,
        deliveryPersonId: deliveryPersons[1].id,
        orderNumber: `ORD-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        status: "PICKED_UP",
        totalAmount: 31.97,
        deliveryFee: 3.99,
        tax: 2.56,
        discount: 5.0,
        estimatedDeliveryTime: new Date(Date.now() + 1800000), // 30 minutes from now
      },
    }),
  ]);

  console.log(`✅ Created ${orders.length} orders`);

  // Seed Order Items
  const orderItems = await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        menuItemId: menuItems[0].id, // Margherita Pizza
        quantity: 1,
        priceAtTime: 12.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        menuItemId: menuItems[2].id, // Caesar Salad
        quantity: 1,
        priceAtTime: 8.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        menuItemId: menuItems[4].id, // Double Bacon Burger
        quantity: 1,
        priceAtTime: 15.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        menuItemId: menuItems[5].id, // French Fries
        quantity: 2,
        priceAtTime: 4.99,
      },
    }),
  ]);

  console.log(`✅ Created ${orderItems.length} order items`);

  // Seed Order Tracking
  const trackingEvents = await Promise.all([
    prisma.orderTracking.create({
      data: {
        orderId: orders[0].id,
        status: "PENDING",
        notes: "Order received",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },
    }),
    prisma.orderTracking.create({
      data: {
        orderId: orders[0].id,
        status: "CONFIRMED",
        notes: "Order confirmed by restaurant",
        timestamp: new Date(Date.now() - 6600000),
      },
    }),
    prisma.orderTracking.create({
      data: {
        orderId: orders[0].id,
        status: "PREPARING",
        notes: "Preparing your order",
        timestamp: new Date(Date.now() - 5400000),
      },
    }),
    prisma.orderTracking.create({
      data: {
        orderId: orders[0].id,
        status: "PICKED_UP",
        location: "Near Main Street",
        latitude: 40.7128,
        longitude: -74.006,
        notes: "On the way!",
        timestamp: new Date(Date.now() - 2400000),
      },
    }),
    prisma.orderTracking.create({
      data: {
        orderId: orders[0].id,
        status: "DELIVERED",
        location: "Delivered to customer",
        latitude: 40.7128,
        longitude: -74.006,
        notes: "Successfully delivered",
        timestamp: new Date(Date.now() - 1800000),
      },
    }),
  ]);

  console.log(`✅ Created ${trackingEvents.length} tracking events`);

  // Seed Payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        orderId: orders[0].id,
        amount: 26.97,
        paymentMethod: "CREDIT_CARD",
        transactionId:
          "TXN-" + Math.random().toString(36).substring(7).toUpperCase(),
        status: "COMPLETED",
      },
    }),
    prisma.payment.create({
      data: {
        orderId: orders[1].id,
        amount: 31.97,
        paymentMethod: "UPI",
        transactionId:
          "TXN-" + Math.random().toString(36).substring(7).toUpperCase(),
        status: "COMPLETED",
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // Seed Reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        restaurantId: restaurants[0].id,
        orderId: orders[0].id,
        rating: 5,
        comment: "Amazing pizza! Will order again.",
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} reviews`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - ${users.length} Users`);
  console.log(`   - ${addresses.length} Addresses`);
  console.log(`   - ${restaurants.length} Restaurants`);
  console.log(`   - ${menuItems.length} Menu Items`);
  console.log(`   - ${deliveryPersons.length} Delivery Persons`);
  console.log(`   - ${orders.length} Orders`);
  console.log(`   - ${orderItems.length} Order Items`);
  console.log(`   - ${trackingEvents.length} Tracking Events`);
  console.log(`   - ${payments.length} Payments`);
  console.log(`   - ${reviews.length} Reviews`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
