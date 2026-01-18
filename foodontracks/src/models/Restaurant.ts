import mongoose, { Schema, Model } from 'mongoose';

export interface IRestaurant {
  _id?: string;
  name: string;
  description: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber: string;
  email: string;
  ownerId: mongoose.Types.ObjectId;
  imageUrl?: string;
  imagePublicId?: string;
  cuisine: string[];
  rating?: number;
  isActive: boolean;
  openingHours?: {
    day: string;
    open: string;
    close: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    cuisine: [{
      type: String,
      trim: true,
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: [{
      day: String,
      open: String,
      close: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
RestaurantSchema.index({ name: 1 });
RestaurantSchema.index({ ownerId: 1 });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ isActive: 1 });

export const Restaurant: Model<IRestaurant> = 
  mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
