/**
 * Script to migrate existing restaurant address to RestaurantAddress collection
 * Run with: node scripts/update-restaurant-address.js
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodontracks';

const RestaurantAddressSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true,
  },
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  landmark: String,
}, { timestamps: true });

const RestaurantAddress = mongoose.models.RestaurantAddress || 
  mongoose.model('RestaurantAddress', RestaurantAddressSchema);

async function migrateRestaurantAddress() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Restaurant details from your data
    const restaurantId = '696364f4d225ab4e1a09f79a';
    
    // Parse the address: "near railway station , Kadapa, AP, 560006"
    const addressData = {
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      street: 'near railway station',
      city: 'Kadapa',
      state: 'AP',
      zipCode: '560006',
      country: 'India',
    };

    // Check if address already exists
    const existingAddress = await RestaurantAddress.findOne({ restaurantId: addressData.restaurantId });
    
    if (existingAddress) {
      console.log('Address already exists. Updating...');
      await RestaurantAddress.findOneAndUpdate(
        { restaurantId: addressData.restaurantId },
        { $set: addressData },
        { new: true }
      );
      console.log('Address updated successfully!');
    } else {
      console.log('Creating new address...');
      await RestaurantAddress.create(addressData);
      console.log('Address created successfully!');
    }

    // Verify the address
    const savedAddress = await RestaurantAddress.findOne({ restaurantId: addressData.restaurantId });
    console.log('\nSaved Address:');
    console.log('Street:', savedAddress.street);
    console.log('City:', savedAddress.city);
    console.log('State:', savedAddress.state);
    console.log('ZipCode:', savedAddress.zipCode);
    console.log('Country:', savedAddress.country);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateRestaurantAddress();
