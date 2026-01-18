/**
 * Test MongoDB Connection
 * Run with: node test-mongo-connection.cjs
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://chetanrayaluthirumalasetty_db_user:HDUAsBEjESJJt822@foodontracks.xhnn504.mongodb.net/?appName=foodontracks';

async function testConnection() {
  console.log('Testing MongoDB connection...\n');
  
  try {
    console.log('Connecting to:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔍 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running (not paused)');
      console.log('3. Check Network Access settings in MongoDB Atlas');
      console.log('4. Whitelist your IP address (0.0.0.0/0 for development)');
    }
    
    process.exit(1);
  }
}

testConnection();
