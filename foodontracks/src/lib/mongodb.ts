import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Connection state tracker
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Enhanced MongoDB connection with error handling, retry logic, and connection pooling
 */
export async function dbConnect() {
  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    // Configure connection options for production
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10, // Maximum number of sockets
      minPoolSize: 2,  // Minimum number of sockets
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    const connection = await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    connectionAttempts = 0;

    // Log successful connection
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
    console.log(`🔌 Database: ${mongoose.connection.name}`);

    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    return connection;
  } catch (error) {
    isConnected = false;
    connectionAttempts++;

    console.error(`❌ MongoDB connection failed (Attempt ${connectionAttempts}/${MAX_RETRIES}):`, error);

    // Retry logic
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return dbConnect(); // Recursive retry
    } else {
      throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error}`);
    }
  }
}

/**
 * Gracefully close the MongoDB connection
 */
export async function dbDisconnect() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('🔌 MongoDB connection closed');
  }
}

export default dbConnect;
