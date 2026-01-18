import mongoose, { Schema, Model } from 'mongoose';

export interface IOrder {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  deliveryPersonId?: mongoose.Types.ObjectId;
  batchNumber: string; // Unique batch ID: foodontrack-XXXXX
  orderNumber?: string; // Display-friendly order number
  items: {
    menuItemId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_by_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  phoneNumber: string;
  paymentMethod: 'cash' | 'card' | 'online';
  paymentStatus: 'pending' | 'completed' | 'failed';
  notes?: string;
  estimatedDeliveryTime?: Date;
  orderTimeline?: {
    orderPlaced?: Date;
    confirmed?: Date;
    preparing?: Date;
    ready?: Date;
    delivered?: Date;
  };
  batchTracking?: {
    preparedBy?: string; // Chef/staff who prepared
    preparedAt?: Date;
    foodTemperature?: number; // Temperature when ready (in Celsius)
    handoverTemperature?: number; // Temperature when given to delivery
    handoverTime?: Date;
    qualityCheck?: boolean;
    notes?: string;
  };
  ratings?: {
    restaurant?: {
      rating?: number; // 1-5
      comment?: string;
      ratedAt?: Date;
    };
    delivery?: {
      rating?: number; // 1-5
      comment?: string;
      ratedAt?: Date;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    deliveryPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    batchNumber: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    items: [{
      menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_by_delivery', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    orderTimeline: {
      orderPlaced: { type: Date },
      confirmed: { type: Date },
      preparing: { type: Date },
      ready: { type: Date },
      delivered: { type: Date },
    },
    batchTracking: {
      preparedBy: { type: String },
      preparedAt: { type: Date },
      foodTemperature: { type: Number }, // Celsius
      handoverTemperature: { type: Number }, // Celsius
      handoverTime: { type: Date },
      qualityCheck: { type: Boolean, default: false },
      notes: { type: String },
    },
    ratings: {
      restaurant: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        ratedAt: { type: Date },
      },
      delivery: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        ratedAt: { type: Date },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ restaurantId: 1 });
OrderSchema.index({ deliveryPersonId: 1 });
OrderSchema.index({ batchNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = 
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
