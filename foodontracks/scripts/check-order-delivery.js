import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const uri = process.env.MONGODB_URI;

async function checkOrder() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    
    const order = await Order.findOne({ batchNumber: 'foodontrack-UJF85T' });
    
    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('\n=== RAW ORDER DATA ===');
    console.log('deliveryPersonId:', order.deliveryPersonId);
    console.log('deliveryPersonId type:', typeof order.deliveryPersonId);
    console.log('deliveryPersonId instanceof ObjectId:', order.deliveryPersonId instanceof mongoose.Types.ObjectId);
    console.log('status:', order.status);
    console.log('batchNumber:', order.batchNumber);
    
    // Try populating
    const populatedOrder = await Order.findOne({ batchNumber: 'foodontrack-UJF85T' })
      .populate('deliveryPersonId', 'name phoneNumber email vehicleNumber');
    
    console.log('\n=== POPULATED ORDER DATA ===');
    console.log('deliveryPersonId:', JSON.stringify(populatedOrder.deliveryPersonId, null, 2));
    
    await mongoose.disconnect();
    console.log('\nDisconnected');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrder();
