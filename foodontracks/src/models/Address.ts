import mongoose, { Schema, Model } from 'mongoose';

export interface IAddress {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'USA',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AddressSchema.index({ userId: 1 });
AddressSchema.index({ isDefault: 1 });

export const Address: Model<IAddress> = 
  mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
