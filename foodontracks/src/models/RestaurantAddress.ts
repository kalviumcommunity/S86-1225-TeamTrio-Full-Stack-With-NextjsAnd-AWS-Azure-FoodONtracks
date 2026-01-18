import mongoose, { Schema, Model } from 'mongoose';

export interface IRestaurantAddress {
  _id?: string;
  restaurantId: mongoose.Types.ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const RestaurantAddressSchema = new Schema<IRestaurantAddress>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true, // One address per restaurant
      index: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index for faster city-based queries
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    landmark: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
RestaurantAddressSchema.index({ city: 1, state: 1 });

export const RestaurantAddress: Model<IRestaurantAddress> = 
  mongoose.models.RestaurantAddress || mongoose.model<IRestaurantAddress>('RestaurantAddress', RestaurantAddressSchema);
