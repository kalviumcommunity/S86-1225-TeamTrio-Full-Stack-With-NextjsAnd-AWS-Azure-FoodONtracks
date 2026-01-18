// Quick script to add restaurant rating to existing review
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodontracks';

async function addRestaurantRating() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Review = mongoose.model('Review', new mongoose.Schema({}, { strict: false }));

    // Update the specific review to add restaurant rating
    const result = await Review.findByIdAndUpdate(
      '69652a5fe9bebad3fdf5724d',
      {
        $set: {
          restaurantRating: 4,
          restaurantComment: 'Great food! Really enjoyed the meal.',
          restaurantRatedAt: new Date(),
        }
      },
      { new: true }
    );

    console.log('✅ Review updated successfully:', result);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addRestaurantRating();
