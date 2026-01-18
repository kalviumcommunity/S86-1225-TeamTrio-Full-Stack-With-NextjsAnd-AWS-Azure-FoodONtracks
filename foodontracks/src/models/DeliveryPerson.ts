import mongoose, { Schema, Model } from 'mongoose';

export interface IDeliveryPerson {
  _id?: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  completedDeliveries?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DeliveryPersonSchema = new Schema<IDeliveryPerson>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car'],
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DeliveryPersonSchema.index({ email: 1 });
DeliveryPersonSchema.index({ isAvailable: 1 });
DeliveryPersonSchema.index({ rating: -1 });

export const DeliveryPerson: Model<IDeliveryPerson> = 
  mongoose.models.DeliveryPerson || mongoose.model<IDeliveryPerson>('DeliveryPerson', DeliveryPersonSchema);
