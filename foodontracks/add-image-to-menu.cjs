const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MenuItemSchema = new mongoose.Schema({}, { strict: false });
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

async function addImageUrl() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update the Pizza item with a sample image URL
    const result = await MenuItem.updateOne(
      { name: 'Pizza' },
      { 
        $set: { 
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop'
        } 
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedItem = await MenuItem.findOne({ name: 'Pizza' }).lean();
    console.log('Updated item:', JSON.stringify(updatedItem, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addImageUrl();
