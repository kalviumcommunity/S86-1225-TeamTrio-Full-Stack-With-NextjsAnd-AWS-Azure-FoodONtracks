const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MenuItemSchema = new mongoose.Schema({}, { strict: false });
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

async function checkMenuItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const items = await MenuItem.find({}).lean();
    console.log('Menu Items:');
    console.log(JSON.stringify(items, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMenuItems();
